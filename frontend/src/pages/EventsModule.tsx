import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { eventService } from '../services/eventService';
import { CreateEventForm } from '../components/events/CreateEventForm';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Users, User, Clock, Plus, Search, Filter, Eye, Edit, Trash2, 
  TrendingUp, CheckCircle, ChevronRight, DownloadCloud, FileText, 
  Image as ImageIcon, CheckSquare, Check, X, Shield, QrCode, Monitor, 
  PieChart as PieChartIcon, Activity, Percent, AlertTriangle, Paperclip,
  Bell, Upload, FolderOpen, Link, Video, Send, Sparkles, Wand2, ClipboardList, RefreshCw
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { mockData } from '../data/mockData';
import api from '../services/api';

const getBannerUrl = (url: string | undefined) => {
  if (!url) return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const baseURL = api.defaults.baseURL || 'http://localhost:8080/api';
  return baseURL.replace(/\/api$/, '') + url;
};



const getFileUrl = (url: string | undefined) => {
  if (!url) return '#';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const baseURL = api.defaults.baseURL || 'http://localhost:8080/api';
  const base = baseURL.replace(/\/api$/, '');
  return url.startsWith('/') ? base + url : base + '/' + url;
};

const EVENT_CATEGORIES = ['Technical', 'Workshop', 'Seminar', 'Hackathon', 'Cultural', 'Sports', 'Placement', 'Guest Lecture', 'Competition', 'Other'];

export const EventsModule = () => {
  const { role, user } = useAuth();
  
  // Views & States
  const [currentView, setCurrentView] = useState<'dashboard' | 'create_event' | 'event_details' | 'student_register' | 'student_attendance'>('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Tabs
  const [adminEventTab, setAdminEventTab] = useState('info'); // info, registrations, attendance, notices
  const [studentMainTab, setStudentMainTab] = useState('all'); // all, my
  const [studentEventTab, setStudentEventTab] = useState('info'); // info, attendance, notices
  const [myEventsTab, setMyEventsTab] = useState('registered'); // registered, upcoming, completed, missed

  // Mock Registrations
  const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
  const [totalRegistrations, setTotalRegistrations] = useState<number>(0);
  const [selectedRegistrationForView, setSelectedRegistrationForView] = useState<any>(null);
  // Real Notices
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
  const [newNotice, setNewNotice] = useState<any>({ title: '', description: '', attachmentFileId: null, id: null });
  const [noticeFile, setNoticeFile] = useState<File | null>(null);
  const [isUploadingNotice, setIsUploadingNotice] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);

  const [showStartAttendanceModal, setShowStartAttendanceModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [startAttendanceForm, setStartAttendanceForm] = useState({
    uniqueCodeCount: 50,
    timerDurationMinutes: 15,
    halfType: 'First Half',
    selectedLectures: [] as string[],
    isIncludedInOverall: false,
    attendanceCode: ''
  });
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const toggleLecture = (l: string) => {
    setStartAttendanceForm(prev => ({
      ...prev,
      selectedLectures: prev.selectedLectures.includes(l) 
        ? prev.selectedLectures.filter(x => x !== l) 
        : [...prev.selectedLectures, l]
    }));
  };

  const handleStartAttendance = async () => {
    if (!selectedEvent) return;
    
    if (startAttendanceForm.isIncludedInOverall && startAttendanceForm.selectedLectures.length === 0) {
      toast.error("Please select at least one lecture");
      return;
    }

    const toastId = toast.loading("Starting attendance session...");
    try {
      const payload = {
        ...startAttendanceForm,
        selectedLectures: JSON.stringify(startAttendanceForm.selectedLectures)
      };
      const res = await eventService.startAttendance(selectedEvent.id, payload);
      if (res.success) {
        setActiveSession(res.data);
        setShowStartAttendanceModal(false);
        toast.success("Attendance session started", { id: toastId });
      } else {
        toast.error(res.message || "Failed to start attendance", { id: toastId });
      }
    } catch (err) {
      toast.error("An error occurred", { id: toastId });
    }
  };

  const fetchEventDetails = (eventId: string) => {
    eventService.getEventNotices(eventId).then(res => {
      if(res.success) setNotices(res.data);
    });
    eventService.getAttendanceSessions(eventId).then(res => {
      if(res.success) {
        setAttendanceSessions(res.data);
        if(res.data.length > 0) {
          setActiveSession(res.data[0]);
          setIsAttendanceSubmitted(res.data[0].isSubmittedByCurrentUser || false);
        }
      }
    });
  };

  
  useEffect(() => {
    let interval: any;
    if (activeSession && activeSession.status === 'LIVE' && activeSession.sessionStartTime && activeSession.timerDurationMinutes) {
      interval = setInterval(() => {
        const start = new Date(activeSession.sessionStartTime).getTime();
        const durationMs = activeSession.timerDurationMinutes * 60 * 1000;
        const now = new Date().getTime();
        const elapsed = now - start;
        const remaining = durationMs - elapsed;
        
        if (remaining <= 0) {
          setTimeRemaining('00:00');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      setTimeRemaining(null);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (activeSession) {
      if (role !== 'student') {
        eventService.getSessionRecordsWithStats(activeSession.id).then(res => {
          if (res.success) {
            setSessionStats(res.data);
          }
        });
      }
    }
  }, [activeSession, role]);

  useEffect(() => {
    if (selectedEvent) {
      if (role !== 'student') {
        eventService.getEventRegistrations(selectedEvent.id).then(res => {
          if(res.success) {
            setRegisteredStudents(res.data.content || []);
            setTotalRegistrations(res.data.totalElements || res.data.content?.length || 0);
          }
        });
      }
      fetchEventDetails(selectedEvent.id);
    }
  }, [selectedEvent, role]);
  
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const fetchEvents = () => {
    if (role === 'student') {
      eventService.getAvailableEvents().then(res => {
        if(res.success) setEvents(res.data);
      }).catch(err => {
        toast.error("Failed to fetch available events");
      });
    } else {
      eventService.getAllEvents().then(res => {
        if(res.success) setEvents(res.data.content);
      }).catch(err => {
        toast.error("Failed to fetch all events");
      });
    }
  };
  const fetchStats = () => {
    eventService.getStatistics().then(res => {
      if(res.success) setStats(res.data);
    }).catch(err => {
      console.error("Failed to fetch statistics", err);
    });
  };
  useEffect(() => { fetchEvents(); fetchStats(); }, []);

  // States for student actions
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAttendanceSubmitted, setIsAttendanceSubmitted] = useState(false);
  const [customFormResponses, setCustomFormResponses] = useState<Record<string, string>>({});
  const [showExternalRegConfirmModal, setShowExternalRegConfirmModal] = useState(false);
  const [clickedExternalLinks, setClickedExternalLinks] = useState<Record<string, boolean>>({});

  // Modals & Form Builder
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({ label: '', type: 'Text' });
  
  const [attendanceCode, setAttendanceCode] = useState('');

  // Create Event - Notification drafts
  const [eventNotifications, setEventNotifications] = useState<any[]>([]);
  const [newEventNotification, setNewEventNotification] = useState({ title: '', description: '', attachment: 'None' });

  // Create Event - Resources
  const [eventResources, setEventResources] = useState<any[]>([]);

  // Preview mode
  const [showPreview, setShowPreview] = useState(false);

  // Create Event Form State
  const [newEventForm, setNewEventForm] = useState<{
    title: string; subtitle: string; category: string; description: string;
    academicYear: string[]; semester: string[]; department: string;
    targetClasses: string[]; venue: string; locationLink: string; mode: string;
    meetingLink: string; regStartDate: string; regEndDate: string; maxParticipants: string; regFee: string; isRegRequired: string;
    registrationMethod: string; registrationExternalLink: string; registrationFile: string;
    allowWaitingList: boolean; autoCloseRegistration: boolean;
    isAttRequired: string; attendanceTiming: string; autoClose: string;
    verificationQuestion: string; correctAnswer: string; attStartTime: string; attEndTime: string;
    includeInOverall: string;
    date: string; startTime: string; endTime: string;
  }>({
    title: '', subtitle: '', category: 'Technical', description: '',
    academicYear: [], semester: [], department: 'All Departments',
    targetClasses: [], venue: '', locationLink: '', mode: 'Offline',
    meetingLink: '', regStartDate: '', regEndDate: '', maxParticipants: '', regFee: '', isRegRequired: 'Yes',
    registrationMethod: 'Create Registration Form', registrationExternalLink: '', registrationFile: '',
    allowWaitingList: false, autoCloseRegistration: true,
    isAttRequired: 'Yes', attendanceTiming: 'During Event (Manual Code Generation)', autoClose: '15 Minutes',
    verificationQuestion: '', correctAnswer: '', attStartTime: '', attEndTime: '',
    includeInOverall: 'Exclude this Event Attendance from Overall Student Attendance',
    date: '', startTime: '', endTime: ''
  });

  const handleDeleteEventClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToDelete(eventId);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    const eventId = eventToDelete;
    setEventToDelete(null);
    const toastId = toast.loading("Deleting event...");
    try {
      const res = await eventService.deleteEvent(eventId);
      if (res.success) {
        toast.success("Event deleted successfully", { id: toastId });
        fetchEvents();
      }
    } catch (err) {
      toast.error("Failed to delete event", { id: toastId });
    }
  };

  const handleCreateEvent = () => {
    if (!newEventForm.title || !newEventForm.date || !newEventForm.venue) {
      alert("Please fill in the required fields (Title, Date, Venue).");
      return;
    }
    const newEvt = {
      id: `evt-${Date.now()}`,
      title: newEventForm.title,
      category: newEventForm.category,
      banner: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      venue: newEventForm.venue,
      date: newEventForm.date,
      startTime: newEventForm.startTime,
      endTime: newEventForm.endTime,
      regDeadline: newEventForm.regEndDate,
      maxParticipants: newEventForm.maxParticipants ? parseInt(newEventForm.maxParticipants) : 500,
      registeredCount: 0,
      status: 'Upcoming',
      description: newEventForm.description,
      isRegRequired: newEventForm.isRegRequired === 'Yes',
      registrationMethod: newEventForm.registrationMethod,
      registrationExternalLink: newEventForm.registrationExternalLink,
      registrationFile: newEventForm.registrationFile,
      isAttRequired: newEventForm.isAttRequired === 'Yes',
      organizer: newEventForm.department,
      rules: ['Valid student ID required'],
    };
    setEvents([newEvt, ...events]);
    setCurrentView('dashboard');
    setEventNotifications([]);
    setEventResources([]);
    setCustomFields([]);
    alert('Event created successfully!');
    setNewEventForm({
      title: '', subtitle: '', category: 'Technical', description: '',
      academicYear: [], semester: [], department: 'All Departments',
      targetClasses: [], venue: '', locationLink: '', mode: 'Offline',
      meetingLink: '', regStartDate: '', regEndDate: '', maxParticipants: '', regFee: '', isRegRequired: 'Yes',
      registrationMethod: 'Create Registration Form', registrationExternalLink: '', registrationFile: '',
      allowWaitingList: false, autoCloseRegistration: true,
      isAttRequired: 'Yes', attendanceTiming: 'During Event (Manual Code Generation)', autoClose: '15 Minutes',
      verificationQuestion: '', correctAnswer: '', attStartTime: '', attEndTime: '',
      includeInOverall: 'Exclude this Event Attendance from Overall Student Attendance',
      date: '', startTime: '', endTime: ''
    });
  };

  // Render Functions
  
  const getEventStatus = (event: any) => {
    if (!event.eventDate) return 'UPCOMING';
    const now = new Date();
    const dateStr = new Date(event.eventDate).toISOString().split('T')[0];
    const eventStartDate = new Date(`${dateStr}T${event.startTime || '00:00'}`);
    const eventEndDate = new Date(`${dateStr}T${event.endTime || '23:59'}`);
    if (now < eventStartDate) return 'UPCOMING';
    if (now >= eventStartDate && now <= eventEndDate) return 'ONGOING';
    return 'CLOSED';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString();
  };

  const normalizeTargets = (targets: any[]) => {
    if (!targets) return [];
    const map = new Map();
    targets.forEach(t => {
      const key = t.isEntireBatch ? `batch_${t.batchYear}` : `${t.batchYear}_${t.academicYear}_${t.semester}`;
      if (!map.has(key)) map.set(key, { ...t, classes: new Set() });
      if (t.acroClassName) map.get(key).classes.add(t.acroClassName);
    });
    return Array.from(map.values()).map(t => {
      if (t.isEntireBatch) return t;
      const classNames = Array.from(t.classes);
      const normalized = classNames.map((c: any) => (c === 'CSE(DS)' || c === 'DS') ? 'CSE(DS) / DS' : c);
      const uniqueClasses = Array.from(new Set(normalized));
      return { ...t, acroClassName: uniqueClasses.join(' & ') };
    });
  };

  const getTargetString = (targets: any[]) => {
    const normTargets = normalizeTargets(targets);
    if (!normTargets || normTargets.length === 0) return 'No targets';
    if (normTargets.length === 1) {
      const t = normTargets[0];
      if (t.isEntireBatch) return `Entire Batch • ${t.batchYear}`;
      return `${t.batchYear} • ${t.academicYear} • ${t.semester} • ${t.acroClassName || 'All'}`;
    }
    return `${normTargets.length} Groups Targeted`;
  };

  const getEventLocation = (event: any) => {
    if (event.mode === 'Online') return event.locationLink || 'Online Meet';
    if (event.mode === 'Hybrid') return `${event.venue || 'No Venue'} / ${event.locationLink || 'Meet'}`;
    return event.venue || event.locationLink || 'No Location';
  };

  const renderAdminDashboard = () => {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">Events Dashboard</h2>
            <p className="text-muted-foreground font-medium">Manage campus events, registrations, and attendance.</p>
          </div>
          <Button onClick={() => setCurrentView('create_event')} className="bg-primary text-white gap-2 shadow-lg shadow-primary/20">
            <Plus size={18} /> Create Event
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: stats?.totalEvents || 0, icon: <Calendar size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Upcoming Events', value: stats?.upcomingEvents || 0, icon: <TrendingUp size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Ongoing Events', value: stats?.ongoingEvents || 0, icon: <Clock size={18} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Completed Events', value: stats?.completedEvents || 0, icon: <CheckCircle size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-start hover:shadow-md transition-all">
              <div className={cn("p-2 rounded-xl mb-3", stat.bg, stat.color)}>
                {stat.icon}
              </div>
              <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Event List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-foreground">Manage Events</h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input type="text" placeholder="Search events..." className="pl-10 pr-4 py-2 text-sm border border-border rounded-xl bg-background" />
              </div>
              <Button variant="outline" className="gap-2"><Filter size={16}/> Filter</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => renderEventCard(event, true))}
          </div>
        </div>
      </div>
    );
  };



  const renderEventCard = (event: any, isAdmin: boolean) => {
    const currentStatus = getEventStatus(event);
    const posterUrl = getBannerUrl(event.posterFileUrl);
    return (
    <div key={event.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col h-full relative">
      <div className="h-48 overflow-hidden relative">
        <img src={posterUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
          <span className={cn("absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg",
            currentStatus === 'ONGOING' ? 'bg-amber-500 text-white' : currentStatus === 'CLOSED' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
          )}>
            {currentStatus}
          </span>
          {!isAdmin && (
            <span className={cn("absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg",
              event.isRegistered ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
            )}>
              {event.isRegistered ? 'REGISTERED' : 'NOT REGISTERED'}
            </span>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-black text-foreground mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-2">{event.title}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{event.category}</span>
        
        <div className="space-y-2 mb-6 flex-grow">
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Calendar size={14} className="text-primary/70"/> {formatDate(event.eventDate)} • {event.startTime} - {event.endTime}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><MapPin size={14} className="text-primary/70"/> {event.mode} • {getEventLocation(event)}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Users size={14} className="text-primary/70"/> {getTargetString(event.targets)}</p>
          
          {event.isRegRequired ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium mt-2"><Activity size={14} className="text-primary/70"/> Registration {currentStatus === 'CLOSED' ? 'Closed' : 'Open'} • {event.currentParticipants || 0} Registered</p>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium mt-2"><Activity size={14} className="text-primary/70"/> Registration Disabled</p>
          )}
        </div>
        
        {isAdmin ? (
          <div className="space-y-2 mt-auto">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs font-bold" onClick={() => { setSelectedEvent(event); setAdminEventTab('info'); setCurrentView('event_details'); }}><Eye size={14} className="mr-1"/> View</Button>
              <Button variant="outline" className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20" size="icon" onClick={(e) => handleDeleteEventClick(event.id, e)}><Trash2 size={14}/></Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Button variant="outline" className="w-full text-xs font-bold" onClick={() => { setSelectedEvent(event); setIsRegistered(event.isRegistered || false); setCurrentView('event_details'); setStudentEventTab('info'); }}>View Details</Button>
          </div>
        )}
      </div>
    </div>
    );
  };

  const renderCreateEvent = () => (<CreateEventForm onCancel={() => setCurrentView('dashboard')} onSave={() => { setCurrentView('dashboard'); fetchEvents(); }} />);

  const renderAdminEventDetails = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('dashboard')} className="rounded-full hover:bg-accent"><ChevronRight className="rotate-180" /></Button>
        <div>
          <h2 className="text-3xl font-black text-foreground">{selectedEvent.title}</h2>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar size={14}/> {formatDate(selectedEvent.eventDate)} • <MapPin size={14}/> {selectedEvent.venue}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto hide-scrollbar bg-card rounded-t-xl px-4 pt-2">
        <div className="flex gap-6 min-w-max">
          {[
            { id: 'info', label: 'Overview', icon: <FileText size={16} /> },
            { id: 'registrations', label: 'Registrations', icon: <Users size={16} /> },
            { id: 'attendance', label: 'Event Attendance', icon: <CheckSquare size={16} /> },
            { id: 'notices', label: 'Event Notifications', icon: <Monitor size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAdminEventTab(tab.id)}
              className={cn(
                "pb-4 text-sm font-bold capitalize transition-all relative flex items-center gap-2",
                adminEventTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon} {tab.label}
              {adminEventTab === tab.id && <motion.div layoutId="admEvtTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={adminEventTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          
          {/* INFO TAB */}
          {adminEventTab === 'info' && (
            <div className="space-y-8">
              {/* Event Header */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
                {(selectedEvent.posterFileUrl || true) ? (
                  <img src={getBannerUrl(selectedEvent.posterFileUrl)} alt="Banner" className="w-full md:w-1/3 h-64 object-cover" />
                ) : (
                  <div className="w-full md:w-1/3 h-64 bg-accent flex items-center justify-center text-muted-foreground flex-col">
                    <ImageIcon size={48} className="mb-2 opacity-50" />
                    <span className="font-bold">No Banner Uploaded</span>
                  </div>
                )}
                <div className="p-8 flex flex-col justify-center flex-1">
                  <span className={cn("text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full w-max mb-3 shadow-sm",
                    getEventStatus(selectedEvent) === 'ONGOING' ? 'bg-amber-100 text-amber-700' : getEventStatus(selectedEvent) === 'CLOSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  )}>
                    {getEventStatus(selectedEvent)}
                  </span>
                  <h3 className="text-3xl font-black mb-2">{selectedEvent.title}</h3>
                  <p className="text-primary font-bold uppercase tracking-wider text-sm mb-4">{selectedEvent.category}</p>
                  <p className="text-muted-foreground font-medium flex gap-4">
                    <span className="flex items-center gap-1"><Calendar size={16}/> {formatDate(selectedEvent.eventDate)}</span>
                    <span className="flex items-center gap-1"><Clock size={16}/> {selectedEvent.startTime}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                  {/* BASIC INFORMATION */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-black text-lg uppercase tracking-wider mb-4 border-b border-border pb-2 text-foreground">BASIC INFORMATION</h3>
                    <div className="space-y-4">
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Event Title</span><span className="font-bold">{selectedEvent.title}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Event Category</span><span className="font-bold">{selectedEvent.category}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Description</span><p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p></div>
                    </div>
                  </div>

                  {/* SCHEDULE & LOCATION */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-black text-lg uppercase tracking-wider mb-4 border-b border-border pb-2 text-foreground">SCHEDULE & LOCATION</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Event Date</span><span className="font-bold">{formatDate(selectedEvent.eventDate)}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Mode</span><span className="font-bold">{selectedEvent.mode}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Start Time</span><span className="font-bold">{selectedEvent.startTime}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">End Time</span><span className="font-bold">{selectedEvent.endTime}</span></div>
                      
                      {selectedEvent.mode !== 'Online' && (
                        <div className="col-span-2"><span className="text-xs font-bold text-muted-foreground block mb-1">Venue / Location</span><span className="font-bold">{selectedEvent.venue}</span></div>
                      )}
                      {selectedEvent.mode !== 'Offline' && selectedEvent.locationLink && (
                        <div className="col-span-2"><span className="text-xs font-bold text-muted-foreground block mb-1">Meet Link</span><a href={selectedEvent.locationLink} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline break-all">{selectedEvent.locationLink}</a></div>
                      )}
                    </div>
                  </div>
                  
                  {/* CREATOR INFORMATION */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-black text-lg uppercase tracking-wider mb-4 border-b border-border pb-2 text-foreground">CREATOR INFORMATION</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Created By</span><span className="font-bold">{selectedEvent.creatorName || 'Unknown'}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Created Date</span><span className="font-bold">{selectedEvent.createdDate ? new Date(selectedEvent.createdDate).toLocaleString() : 'Unknown'}</span></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* TARGET CLASSES */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-black text-lg uppercase tracking-wider mb-4 border-b border-border pb-2 text-foreground">TARGET CLASSES</h3>
                    <div className="space-y-3">
                      {selectedEvent.targets && selectedEvent.targets.length > 0 ? normalizeTargets(selectedEvent.targets).map((t: any, idx: number) => (
                        <div key={idx} className="bg-accent/40 p-3 rounded-xl border border-border">
                          {t.isEntireBatch ? (
                            <span className="font-bold block">Entire Batch • {t.batchYear}</span>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="font-bold">{t.batchYear} • {t.academicYear} • {t.semester} • {t.acroClassName || 'All'}</span>
                            </div>
                          )}
                        </div>
                      )) : (
                        <p className="text-muted-foreground font-medium">No target classes specified.</p>
                      )}
                    </div>
                  </div>

                  {/* REGISTRATION */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-black text-lg uppercase tracking-wider mb-4 border-b border-border pb-2 text-foreground">REGISTRATION</h3>
                    {selectedEvent.isRegRequired ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-xs font-bold text-muted-foreground block mb-1">Registration Status</span><span className="font-bold text-primary">Enabled</span></div>
                        <div><span className="text-xs font-bold text-muted-foreground block mb-1">Current Registration</span><span className="font-bold">{selectedEvent.currentParticipants || 0}</span></div>
                        {selectedEvent.registrationStart && <div><span className="text-xs font-bold text-muted-foreground block mb-1">Start Date</span><span className="font-bold">{new Date(selectedEvent.registrationStart).toLocaleDateString()}</span></div>}
                        {selectedEvent.registrationEnd && <div><span className="text-xs font-bold text-muted-foreground block mb-1">End Date</span><span className="font-bold">{new Date(selectedEvent.registrationEnd).toLocaleDateString()}</span></div>}
                        {selectedEvent.maxParticipants && <div><span className="text-xs font-bold text-muted-foreground block mb-1">Max Participants</span><span className="font-bold">{selectedEvent.maxParticipants}</span></div>}
                        {selectedEvent.registrationFee > 0 && <div><span className="text-xs font-bold text-muted-foreground block mb-1">Fee</span><span className="font-bold">₹{selectedEvent.registrationFee}</span></div>}
                        <div><span className="text-xs font-bold text-muted-foreground block mb-1">Waiting List</span><span className="font-bold">{selectedEvent.allowWaitingList ? 'Enabled' : 'Disabled'}</span></div>
                        <div className="col-span-2"><span className="text-xs font-bold text-muted-foreground block mb-1">Method</span><span className="font-bold">{selectedEvent.registrationMethod}</span></div>
                        {selectedEvent.registrationMethod === 'Via AI' && selectedEvent.aiRegistrationFormConfig && (
                          <div className="col-span-2 mt-4 p-4 bg-accent/20 border border-border rounded-xl">
                             <h4 className="font-bold text-sm mb-2">AI Registration Form Fields:</h4>
                             <ul className="space-y-1 list-disc pl-4 text-sm font-medium">
                               {JSON.parse(selectedEvent.aiRegistrationFormConfig).map((f: any, i: number) => (
                                 <li key={i}>{f.label} <span className="text-muted-foreground">({f.type})</span> {f.required && <span className="text-rose-500">*</span>}</li>
                               ))}
                             </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground font-bold">Registration Disabled</p>
                    )}
                  </div>

                  {/* ATTENDANCE */}
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="font-black text-lg uppercase tracking-wider mb-4 border-b border-border pb-2 text-foreground">ATTENDANCE</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Attendance Status</span><span className="font-bold text-primary">{selectedEvent.isAttendanceConfigured ? 'Configured' : 'Pending Configuration'}</span></div>
                      <div><span className="text-xs font-bold text-muted-foreground block mb-1">Attendance Inclusion</span><span className="font-bold">{selectedEvent.includeInOverallAttendance ? 'Include in Overall' : 'Exclude from Overall'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {adminEventTab === 'registrations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Registered</p>
                  <p className="text-3xl font-black text-foreground mt-2">{totalRegistrations}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Remaining Seats</p>
                  <p className="text-3xl font-black text-emerald-500 mt-2">{selectedEvent.maxParticipants > 0 ? selectedEvent.maxParticipants - totalRegistrations : 'Unlimited'}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Registration Percentage</p>
                  <p className="text-3xl font-black text-primary mt-2">{selectedEvent.maxParticipants > 0 ? ((totalRegistrations/selectedEvent.maxParticipants)*100).toFixed(1) + '%' : 'N/A'}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-accent/20">
                  <h3 className="font-bold text-lg">Student Registrations</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 bg-background font-bold text-emerald-600 border-emerald-200"><DownloadCloud size={16}/> Export CSV</Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-accent/40 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Student Name</th>
                        <th className="px-6 py-4">Enrollment Number</th>
                        <th className="px-6 py-4">Batch</th>
                        <th className="px-6 py-4">Year</th>
                        <th className="px-6 py-4">Sem</th>
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Registration Time</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Custom Responses</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {registeredStudents.map((student: any) => (
                        <tr key={student.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground">{student.studentName || student.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{student.enrollmentNo || student.enrollmentNumber || 'N/A'}</td>
                          <td className="px-6 py-4 font-medium">{student.batchYear || 'N/A'}</td>
                          <td className="px-6 py-4 font-medium">
                            {student.semester && !isNaN(parseInt(student.semester)) 
                              ? Math.ceil(parseInt(student.semester)/2) 
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 font-medium">{student.semester || 'N/A'}</td>
                          <td className="px-6 py-4 font-medium">{student.className || 'N/A'}</td>
                          <td className="px-6 py-4 text-muted-foreground">{student.registeredAt ? new Date(student.registeredAt).toLocaleString() : 'N/A'}</td>
                          <td className="px-6 py-4">
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-[11px] font-black uppercase inline-flex items-center gap-1 w-max">
                              <Check size={14} strokeWidth={3}/> Confirmed
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {student.customFormResponses ? (
                              <div className="max-w-[150px] truncate" title={student.customFormResponses}>
                                {Object.entries(JSON.parse(student.customFormResponses)).map(([k,v]) => `${k}: ${v}`).join(', ')}
                              </div>
                            ) : 'None'}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="font-bold" onClick={() => setSelectedRegistrationForView(student)}><Eye size={14} className="mr-1"/> View</Button>
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50"><Trash2 size={14}/></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

                      {/* ATTENDANCE TAB */}
            {adminEventTab === 'attendance' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {!activeSession || activeSession.status === 'NOT_STARTED' || activeSession.status === 'CLOSED' ? (
                  <div className="lg:col-span-3 p-12 bg-card border border-border rounded-3xl shadow-xl text-center">
                    <QrCode size={64} className="mx-auto text-primary mb-6" />
                    <h3 className="text-3xl font-black mb-2">Conduct Event Attendance</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">Configure and start a live attendance session for this event. Students will use the code to mark their presence.</p>
                    {activeSession?.status === 'CLOSED' && (
                      <div className="mb-8 bg-accent/30 p-5 rounded-3xl border border-border flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 max-w-lg mx-auto shadow-sm">
                        <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0 mt-0.5">
                          <CheckCircle size={24} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-black text-foreground mb-1 text-lg">Previous Session Closed</h4>
                          <p className="text-sm font-medium text-muted-foreground leading-relaxed">You can safely start a new attendance session. The previous attendance records have been securely stored in the database.</p>
                        </div>
                      </div>
                    )}
                    <Button size="lg" onClick={() => setShowStartAttendanceModal(true)} className="text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 bg-primary text-white font-black">
                      Start Attendance
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-2 w-max">
                              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                              LIVE SESSION
                            </span>
                            <h3 className="text-2xl font-black mt-4">Attendance Dashboard</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Time Remaining</p>
                            <p className="text-3xl font-black text-rose-500 font-mono">{timeRemaining || '00:00'}</p>
                          </div>
                        </div>

                        <div className="bg-accent/50 border border-primary/20 p-6 rounded-2xl text-center mb-6">
                          <p className="text-sm font-bold text-muted-foreground uppercase mb-2">Active Attendance Code</p>
                          <p className="text-6xl font-black text-primary tracking-[0.5em] font-mono">{activeSession.attendanceCode}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-background border border-border p-4 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Unique Codes</p>
                            <p className="text-lg font-black">{activeSession.uniqueCodeCount}</p>
                          </div>
                          <div className="bg-background border border-border p-4 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Timer</p>
                            <p className="text-lg font-black">{activeSession.timerDurationMinutes}m</p>
                          </div>
                          <div className="bg-background border border-border p-4 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Overall</p>
                            <p className="text-lg font-black">{activeSession.isIncludedInOverall ? 'Included' : 'Excluded'}</p>
                          </div>
                          <div className="bg-background border border-border p-4 rounded-xl text-center">
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Selected</p>
                            <p className="text-lg font-black">{JSON.parse(activeSession.selectedLectures || '[]').length} Lectures</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <Button 
                            className="flex-1 py-6 rounded-2xl font-bold bg-amber-500 hover:bg-amber-600 text-white gap-2"
                            onClick={() => {
                              eventService.generateAttendanceCode(activeSession.id).then(res => {
                                if (res.success) {
                                  toast.success("Code regenerated");
                                  fetchEventDetails(selectedEvent.id);
                                }
                              });
                            }}
                          >
                            <RefreshCw size={20}/> Regenerate Code
                          </Button>
                          <Button 
                            className="flex-1 py-6 rounded-2xl font-bold bg-rose-600 hover:bg-rose-700 text-white gap-2"
                            onClick={() => {
                              eventService.closeAttendance(activeSession.id).then(res => {
                                if (res.success) {
                                  toast.success("Attendance closed");
                                  fetchEventDetails(selectedEvent.id);
                                }
                              });
                            }}
                          >
                            <X size={20}/> Close Attendance
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-all">
                            <div className="absolute -right-6 -top-6 text-primary/5 group-hover:text-primary/10 transition-colors transform group-hover:scale-110">
                              <Users size={140} />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                              <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-inner">
                                <Users size={20} />
                              </div>
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total</p>
                            </div>
                            <div className="relative z-10">
                              <p className="text-5xl font-black text-foreground">{sessionStats?.totalRegistered || 0}</p>
                            </div>
                          </div>
                        
                          <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all">
                            <div className="absolute -right-6 -top-6 text-amber-500/5 group-hover:text-amber-500/10 transition-colors transform group-hover:scale-110">
                              <Clock size={140} />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                              <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl shadow-inner">
                                <Clock size={20} />
                              </div>
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pending</p>
                            </div>
                            <div className="relative z-10">
                              <p className="text-5xl font-black text-foreground">{(sessionStats?.totalRegistered || 0) - (sessionStats?.submitted || 0) - (sessionStats?.absent || 0)}</p>
                            </div>
                          </div>
                        
                          <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                            <div className="absolute -right-6 -top-6 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors transform group-hover:scale-110">
                              <CheckCircle size={140} />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner">
                                <CheckCircle size={20} />
                              </div>
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Submitted</p>
                            </div>
                            <div className="relative z-10">
                              <p className="text-5xl font-black text-foreground">{sessionStats?.submitted || 0}</p>
                            </div>
                          </div>
                        
                          <div className="bg-card border border-border p-6 rounded-[2rem] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/50 transition-all">
                            <div className="absolute -right-6 -top-6 text-rose-500/5 group-hover:text-rose-500/10 transition-colors transform group-hover:scale-110">
                              <X size={140} />
                            </div>
                            <div className="flex items-center gap-3 mb-6 relative z-10">
                              <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl shadow-inner">
                                <X size={20} />
                              </div>
                              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Absent</p>
                            </div>
                            <div className="relative z-10">
                              <p className="text-5xl font-black text-foreground">{sessionStats?.absent || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                  </>
                )}
                
                {/* STUDENT ATTENDANCE LIST */}
                {sessionStats && sessionStats.records && (
                  <div className="mt-12 lg:col-span-3 bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-accent/30 flex justify-between items-center">
                      <h4 className="text-xl font-black">Student Attendance Roster</h4>
                      <span className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                        {sessionStats.totalRegistered} Registered
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-muted/95 backdrop-blur z-10">
                          <tr className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                            <th className="p-4 border-b border-border">Enrollment No</th>
                            <th className="p-4 border-b border-border">Name</th>
                            <th className="p-4 border-b border-border">Class & Section</th>
                            <th className="p-4 border-b border-border">Code Used</th>
                            <th className="p-4 border-b border-border">Time</th>
                            <th className="p-4 border-b border-border text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...sessionStats.records].sort((a, b) => {
                            if (activeSession?.status === 'LIVE') {
                              if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                              if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                            }
                            return a.studentName.localeCompare(b.studentName);
                          }).map((record: any) => (
                            <tr key={record.studentId} className="border-b border-border hover:bg-accent/50 transition-colors">
                              <td className="p-4 text-sm font-bold">{record.enrollmentNo}</td>
                              <td className="p-4 text-sm font-medium">{record.studentName}</td>
                              <td className="p-4 text-sm font-medium">{record.className}</td>
                              <td className="p-4 text-sm font-medium font-mono">{record.uniqueCodeUsed || '-'}</td>
                              <td className="p-4 text-sm text-muted-foreground font-medium">
                                {record.submittedAt ? new Date(record.submittedAt).toLocaleTimeString() : '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  record.status === 'SUBMITTED' ? "bg-emerald-100 text-emerald-700" :
                                  record.status === 'ABSENT' ? "bg-rose-100 text-rose-700" :
                                  record.status === 'NOT_SUBMITTED' ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" :
                                  "bg-amber-100 text-amber-700"
                                )}>
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* NOTICES TAB */}
          {adminEventTab === 'notices' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                  <h3 className="text-xl font-black">Event Notifications</h3>
                  <p className="text-sm text-muted-foreground font-medium">Publish updates, schedules, and materials to participants.</p>
                </div>
                <Button className="gap-2 bg-primary px-6 font-bold" onClick={() => setShowNoticeModal(true)}>
                  <Plus size={16}/> Publish Notice
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {notices.map((notice) => (
                  <div key={notice.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full">
                        Update
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-foreground mb-2">{notice.title}</h4>
                    <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">{notice.description}</p>
                    
                    {notice.attachmentFileUrl && (
                      <div className="mb-6 flex gap-2">
                        <a href={getFileUrl(notice.attachmentFileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 border border-border rounded-lg bg-accent/30 text-xs font-bold w-max hover:bg-accent transition-colors">
                          <Paperclip size={14} className="text-blue-500" /> View / Open Attachment
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground font-bold">Published: {new Date(notice.createdAt).toLocaleString()}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="font-bold" onClick={() => { setNewNotice({ title: notice.title, description: notice.description, attachmentFileId: notice.attachmentFileId, id: notice.id, attachmentFileUrl: notice.attachmentFileUrl }); setShowNoticeModal(true); }}><Edit size={14} className="mr-1"/> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 font-bold" onClick={() => setNoticeToDelete(notice.id)}><Trash2 size={14} className="mr-1"/> Delete</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  // --- RENDER: STUDENT VIEWS ---
  const renderStudentDashboard = () => (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Campus Events</h2>
          <p className="text-muted-foreground font-medium mt-1 text-lg">Discover, register, and attend college events.</p>
        </div>
      </div>
      
      {/* Premium Dashboard Overview for Student */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Events', value: stats?.totalEvents || 0, icon: <Calendar size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Registered', value: stats?.registeredEvents || 0, icon: <FileText size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Attended', value: stats?.attendedEvents || 0, icon: <CheckCircle size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Missed', value: stats?.missedEvents || 0, icon: <X size={18} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-start hover:shadow-md transition-all">
            <div className={cn("p-2 rounded-xl mb-3", stat.bg, stat.color)}>
              {stat.icon}
            </div>
            <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-2 mb-6 shadow-sm inline-flex">
        {['all', 'my'].map((tab) => (
          <button key={tab} onClick={() => setStudentMainTab(tab)}
            className={cn("px-6 py-2.5 text-sm font-black capitalize transition-all rounded-lg", studentMainTab === tab ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-foreground")}
          >
            {tab === 'all' ? 'All Events' : 'My Events'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={studentMainTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {studentMainTab === 'all' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map(event => renderEventCard(event, false))}
            </div>
          ) : (
            <div className="space-y-8">
               <div className="border-b border-border overflow-x-auto hide-scrollbar">
                  <div className="flex gap-6 min-w-max px-2">
                    {['registered', 'upcoming', 'completed', 'missed'].map((tab) => (
                      <button key={tab} onClick={() => setMyEventsTab(tab)}
                        className={cn("pb-4 text-sm font-black uppercase tracking-wider transition-all relative", myEventsTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                      >
                        {tab} Events
                        {myEventsTab === tab && <motion.div layoutId="myEvtTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                      </button>
                    ))}
                  </div>
                </div>
                <section className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myEventsTab === 'registered' && (
                      events.filter(e => e.isRegistered).length > 0 ? (
                        events.filter(e => e.isRegistered).map(event => renderEventCard(event, false))
                      ) : (
                        <div className="col-span-full text-center py-20 bg-card border border-border rounded-3xl">
                          <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground font-bold text-lg">No registered events found.</p>
                        </div>
                      )
                    )}
                    {myEventsTab === 'completed' && (
                      events.filter(e => getEventStatus(e) === 'CLOSED').length > 0 ? (
                        events.filter(e => getEventStatus(e) === 'CLOSED').map(event => renderEventCard(event, false))
                      ) : (
                        <div className="col-span-full text-center py-20 bg-card border border-border rounded-3xl">
                          <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground font-bold text-lg">No completed events found.</p>
                        </div>
                      )
                    )}
                    {myEventsTab === 'upcoming' && (
                      events.filter(e => !e.isRegistered && getEventStatus(e) === 'UPCOMING').length > 0 ? (
                        events.filter(e => !e.isRegistered && getEventStatus(e) === 'UPCOMING').map(event => renderEventCard(event, false))
                      ) : (
                        <div className="col-span-full text-center py-20 bg-card border border-border rounded-3xl">
                          <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground font-bold text-lg">No upcoming events found.</p>
                        </div>
                      )
                    )}
                    {myEventsTab === 'missed' && (
                      events.filter(e => !e.isRegistered && getEventStatus(e) === 'CLOSED').length > 0 ? (
                        events.filter(e => !e.isRegistered && getEventStatus(e) === 'CLOSED').map(event => renderEventCard(event, false))
                      ) : (
                        <div className="col-span-full text-center py-20 bg-card border border-border rounded-3xl">
                          <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground font-bold text-lg">No missed events found.</p>
                        </div>
                      )
                    )}
                  </div>
                </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  const renderStudentEventDetails = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto pb-12">
      <Button variant="ghost" className="gap-2 -ml-4 font-bold" onClick={() => setCurrentView('dashboard')}><ChevronRight className="rotate-180"/> Back to Events</Button>
      
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-96 relative group">
          <img src={getBannerUrl(selectedEvent.posterFileUrl)} alt="Banner" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute bottom-10 left-10 right-10">
            <span className="text-[10px] font-black uppercase tracking-wider bg-primary text-white px-4 py-1.5 rounded-full mb-4 inline-block shadow-lg">
              {selectedEvent.category}
            </span>
            <h1 className="text-5xl font-black text-white mb-4 leading-tight drop-shadow-lg">{selectedEvent.title}</h1>
            <div className="flex flex-wrap gap-6 text-white/90 font-bold text-sm">
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><Calendar size={16} className="text-primary"/> {selectedEvent.date}</span>
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><Clock size={16} className="text-primary"/> {selectedEvent.startTime} - {selectedEvent.endTime}</span>
              <span className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"><MapPin size={16} className="text-primary"/> {selectedEvent.venue}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-border flex px-4">
          {[
            { id: 'info', label: 'Event Details' },
            { id: 'attendance', label: 'Mark Attendance' },
            { id: 'notices', label: 'Announcements' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setStudentEventTab(tab.id)} className={cn("px-8 py-5 text-sm font-black capitalize transition-all border-b-4", studentEventTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-10">
          {studentEventTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-10">
                <section>
                  <h3 className="text-2xl font-black mb-4">About the Event</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg font-medium">{selectedEvent.description}</p>
                </section>
                <section>
                  <h3 className="text-2xl font-black mb-4">Event Rules & Guidelines</h3>
                  {selectedEvent.rulesAndGuidelines ? (
                    <div className="bg-accent/30 p-6 rounded-2xl border border-border">
                      <p className="text-muted-foreground font-medium whitespace-pre-wrap leading-relaxed">{selectedEvent.rulesAndGuidelines}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground font-medium italic">No specific rules or guidelines provided for this event.</p>
                  )}
                </section>
              </div>
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-3xl p-8 shadow-lg text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-6">Event Organizer</h4>
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-lg">
                    <Users size={32} className="text-foreground" />
                  </div>
                  <p className="font-black text-xl text-foreground mb-1">{selectedEvent.creatorName || selectedEvent.organizer || 'AcroNexus Platform'}</p>
                  <p className="text-sm font-bold text-muted-foreground mb-6">{selectedEvent.departmentName || 'Event Coordinator'}</p>
                  
                  <div className="bg-accent/50 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Registration Deadline</p>
                    <p className="font-black text-rose-500">{selectedEvent.registrationEnd ? new Date(selectedEvent.registrationEnd).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  
                  <div className="bg-accent/50 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Participants</p>
                    <p className="font-black text-foreground">{selectedEvent.registeredCount || 0} / {selectedEvent.maxParticipants || 'Unlimited'}</p>
                  </div>

                  {selectedEvent.registrationMethod === 'Upload Registration Form' && selectedEvent.registrationFile && (
                    <Button variant="outline" className="w-full py-6 rounded-xl font-bold gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors mb-4"><DownloadCloud size={18}/> Download Registration Form</Button>
                  )}
                  
                  <div className="pt-4 mt-4 border-t border-border">
                    {isRegistered ? (
                      <Button disabled className="w-full py-6 rounded-xl font-black text-lg gap-2 bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-500/20 transition-all opacity-100"><CheckCircle size={18}/> REGISTERED</Button>
                    ) : selectedEvent.registrationEnd && new Date() > new Date(new Date(selectedEvent.registrationEnd).setHours(23, 59, 59, 999)) ? (
                      <Button disabled className="w-full py-6 rounded-xl font-black text-lg gap-2 bg-muted text-muted-foreground transition-all shadow-none opacity-100">Deadline Passed</Button>
                    ) : selectedEvent.registrationMethod === 'Manually' ? (
                      selectedEvent.registrationExternalLink ? (
                        <div className="flex flex-col gap-2">
                          <Button 
                            className="relative w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all duration-300 hover:-translate-y-1 overflow-hidden group p-0 border-0" 
                            onClick={() => {
                              window.open(selectedEvent.registrationExternalLink, '_blank');
                              setClickedExternalLinks(prev => ({ ...prev, [selectedEvent.id]: true }));
                            }}
                          >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
                            <div className="relative z-10 flex items-center justify-center gap-2 w-full h-full px-2">
                              <Link size={20} className="group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                              <span className="font-black text-[15px] sm:text-lg tracking-wide uppercase truncate mt-0.5">Register Externally</span>
                              <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300 shrink-0" />
                            </div>
                          </Button>
                          
                          {clickedExternalLinks[selectedEvent.id] && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                              <Button 
                                variant="outline"
                                className="w-full py-5 rounded-2xl font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                onClick={() => setShowExternalRegConfirmModal(true)}
                              >
                                Registered Through Link
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <Button disabled className="w-full py-6 rounded-xl font-black text-lg gap-2 bg-muted text-muted-foreground transition-all shadow-none opacity-100">See Description for Registration Details</Button>
                      )
                    ) : selectedEvent.registrationMethod === 'Via AI' ? (
                      <Button className="w-full py-6 rounded-xl font-black text-lg gap-2 bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20" onClick={() => setCurrentView('student_register')}><CheckSquare size={18}/> Register for Event</Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

                      {studentEventTab === 'attendance' && (
              <div className="max-w-xl mx-auto text-center py-16 space-y-8">
                {(!activeSession || activeSession.status !== 'LIVE') ? (
                  <div className="bg-card border border-border p-10 rounded-[2.5rem] shadow-xl">
                    <Monitor size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-2xl font-black mb-2">No Active Attendance Session</h3>
                    <p className="text-muted-foreground font-medium">Wait for the organizer to start the live attendance session.</p>
                  </div>
                ) : !isAttendanceSubmitted ? (
                  <div className="bg-card border border-border p-10 rounded-[2.5rem] shadow-2xl shadow-primary/10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                    <div className="absolute top-4 right-4 text-right">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Time Remaining</p>
                      <p className="text-2xl font-black text-rose-500 font-mono">{timeRemaining || '00:00'}</p>
                    </div>

                    <Shield size={56} className="mx-auto text-primary mb-6 mt-4" />
                    <h3 className="text-3xl font-black mb-3 text-foreground">Submit Attendance</h3>
                    <p className="text-muted-foreground mb-10 font-medium">Enter the attendance code and your unique secret code to confirm your presence.</p>
                    
                    <div className="space-y-6 text-left mb-8">
                      <div>
                        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2 block mb-2">Event Attendance Code</label>
                        <input type="text" placeholder="ENTER CODE" className="w-full p-5 text-center text-3xl font-black tracking-[0.5em] border-2 border-border rounded-2xl bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 uppercase transition-all shadow-inner" value={attendanceCode} onChange={(e) => setAttendanceCode(e.target.value.toUpperCase())} />
                      </div>
                      <div>
                        <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2 block mb-2">Your Unique Code (1 - {activeSession.uniqueCodeCount})</label>
                        <input type="number" placeholder="e.g. 14" className="w-full p-4 text-center text-xl font-bold border-2 border-border rounded-2xl bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all" value={customFormResponses['uniqueCode'] || ''} onChange={(e) => setCustomFormResponses({...customFormResponses, 'uniqueCode': e.target.value})} />
                      </div>
                    </div>
                    
                    <Button className="w-full py-7 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all" 
                      disabled={timeRemaining === '00:00'}
                      onClick={async () => {
                      if(!activeSession) return toast.error("No active session");
                      try {
                        const uniqueCodeNum = parseInt(customFormResponses['uniqueCode']);
                        if (isNaN(uniqueCodeNum)) return toast.error("Please enter a valid unique code");
                        
                        const res = await eventService.submitAttendance(activeSession.id, attendanceCode, uniqueCodeNum);
                        if(res.success) {
                          setIsAttendanceSubmitted(true);
                          toast.success("Attendance Submitted!");
                        }
                      } catch(e: any) {
                        toast.error(e.response?.data?.message || "Failed to submit attendance");
                      }
                    }}>Submit Attendance</Button>
                  </div>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 p-12 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20">
                     <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
                       <Check size={48} strokeWidth={3} />
                     </div>
                     <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mb-3">Attendance Submitted Successfully</h3>
                     <p className="text-emerald-600/80 dark:text-emerald-500 font-bold text-lg">Your presence has been recorded for this event.</p>
                  </motion.div>
                )}
              </div>
            )}


            {studentEventTab === 'notices' && (
             <div className="space-y-6">
               {notices.map((notice) => (
                 <div key={notice.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <div className="pl-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-full">
                          Update
                        </span>
                        <p className="text-xs text-muted-foreground font-bold">{new Date(notice.createdAt).toLocaleString()}</p>
                      </div>
                      <h4 className="text-2xl font-black text-foreground mb-3">{notice.title}</h4>
                      <p className="text-base text-muted-foreground mb-6 font-medium leading-relaxed">{notice.description}</p>
                      
                      {notice.attachmentFileUrl && (
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <a href={getFileUrl(notice.attachmentFileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-border rounded-xl bg-accent/30 font-bold hover:bg-accent cursor-pointer transition-colors w-max pr-6">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                               <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-sm">View / Open Attachment</p>
                              <p className="text-xs text-muted-foreground font-medium">Click to open</p>
                            </div>
                            <DownloadCloud size={16} className="ml-4 text-muted-foreground" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
               ))}
             </div>
          )}
        </div>
        <AnimatePresence>
          {showExternalRegConfirmModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-card border border-border shadow-2xl rounded-[2rem] w-full max-w-md overflow-hidden relative">
                <div className="p-8 text-center relative z-10">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckSquare size={40} strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-black mb-3">Confirm Registration</h3>
                  <p className="text-muted-foreground font-medium mb-8">Have you completed the external registration form?</p>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 py-6 rounded-xl font-bold" onClick={() => setShowExternalRegConfirmModal(false)}>Cancel</Button>
                    <Button className="flex-1 py-6 rounded-xl font-black bg-primary text-white" onClick={async () => {
                      if (selectedEvent) {
                        try {
                          const res = await eventService.registerForEvent(selectedEvent.id, {});
                          if (res.success) {
                            setIsRegistered(true);
                            setEvents(events.map((e: any) => e.id === selectedEvent.id ? { ...e, isRegistered: true, currentParticipants: (e.currentParticipants || 0) + 1 } : e));
                            toast.success("Registration confirmed!");
                            setShowExternalRegConfirmModal(false);
                          }
                        } catch (e: any) {
                          toast.error(e.response?.data?.message || "Confirmation failed");
                          setShowExternalRegConfirmModal(false);
                        }
                      }
                    }}>Yes, I Registered</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );

  const renderStudentRegisterFlow = () => {
    const aiFields = selectedEvent?.aiRegistrationFormConfig ? (typeof selectedEvent.aiRegistrationFormConfig === 'string' ? JSON.parse(selectedEvent.aiRegistrationFormConfig) : selectedEvent.aiRegistrationFormConfig) : [];
    return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto space-y-6 py-12">
      <Button variant="ghost" className="gap-2 -ml-4 font-bold" onClick={() => setCurrentView('dashboard')}><ChevronRight className="rotate-180"/> Cancel Registration</Button>
      {!isRegistered ? (
        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="h-40 relative">
            <img src={getBannerUrl(selectedEvent.posterFileUrl)} alt="Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
              <div>
                <p className="text-primary font-black uppercase tracking-widest text-xs mb-1">Event Registration</p>
                <h2 className="text-3xl font-black text-white">{selectedEvent.title}</h2>
              </div>
            </div>
          </div>
          <div className="p-10 space-y-8 bg-background">
            <div className="bg-accent/30 border border-border p-6 rounded-2xl flex items-start gap-4">
               <AlertTriangle className="text-amber-500 shrink-0 mt-1" />
               <div>
                 <h4 className="font-bold text-foreground">Confirm Your Details</h4>
                 <p className="text-sm text-muted-foreground font-medium mt-1">Please verify your information before confirming registration. These details will be printed on your E-Pass.</p>
               </div>
            </div>

            {selectedEvent.registrationFee > 0 && selectedEvent.paymentQrFileUrl && (
              <div className="bg-primary/5 border-2 border-primary/20 rounded-[2rem] p-8 text-center space-y-6">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-sm uppercase tracking-wider">
                  <QrCode size={18} /> Payment Required
                </div>
                <h3 className="text-2xl font-black">Registration Fee: <span className="text-primary">₹{selectedEvent.registrationFee}</span></h3>
                <p className="text-muted-foreground font-medium">Please scan the QR code below using any UPI app to complete your payment.</p>
                <div className="bg-white p-4 rounded-3xl inline-block shadow-lg border border-border mx-auto">
                  <img src={getBannerUrl(selectedEvent.paymentQrFileUrl)} alt="Payment QR" className="w-56 h-56 object-contain" />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                <input type="text" value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'N/A'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Enrollment No.</label>
                <input type="text" value={user?.enrollmentNo || 'N/A'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                <input type="email" value={user?.email || 'N/A'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Department</label>
                <input type="text" value={user?.departmentName || 'N/A'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Class</label>
                <input type="text" value={user?.section || 'N/A'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              {aiFields.map((f: any, idx: number) => (
                  <div key={idx} className="space-y-2 col-span-2">
                    {f.type !== 'checkbox' && (
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                    )}
                    {f.type === 'textarea' ? (
                      <textarea required={f.required} value={customFormResponses[f.label] || ''} onChange={e => setCustomFormResponses({...customFormResponses, [f.label]: e.target.value})} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/20" rows={3}></textarea>
                    ) : f.type === 'file' ? (
                      <div className="w-full p-6 border-2 border-dashed border-border rounded-2xl bg-background hover:bg-accent/30 transition-colors flex flex-col items-center justify-center cursor-pointer relative mt-1 shadow-sm">
                        <input type="file" required={f.required && !customFormResponses[f.label]} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const toastId = toast.loading("Uploading file...");
                            try {
                              const res = await eventService.uploadFile(e.target.files[0]);
                              if (res.success && res.data) {
                                setCustomFormResponses(prev => ({...prev, [f.label]: res.data}));
                                toast.success("File uploaded successfully", { id: toastId });
                              } else {
                                toast.error("Upload failed", { id: toastId });
                              }
                            } catch (err) {
                              toast.error("Upload failed", { id: toastId });
                            }
                          }
                        }} />
                        {customFormResponses[f.label] ? (
                          <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-500">
                            <CheckCircle size={32} className="mb-2" />
                            <span className="font-bold text-sm">File Uploaded Successfully</span>
                            <span className="text-xs text-emerald-600/70 mt-1">Click to replace</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground">
                            <Upload size={32} className="mb-2" />
                            <span className="font-bold text-sm">Click or drag file to upload</span>
                            <span className="text-xs mt-1">Max size: 10MB</span>
                          </div>
                        )}
                      </div>
                    ) : f.type === 'checkbox' ? (
                      <label className="flex items-center gap-4 p-5 border border-border rounded-2xl bg-background hover:bg-accent/30 cursor-pointer transition-colors group shadow-sm mt-1">
                        <div className={cn("relative flex items-center justify-center w-6 h-6 rounded-md border-2 transition-colors", customFormResponses[f.label] === 'true' ? "border-primary bg-primary" : "border-muted-foreground group-hover:border-primary")}>
                          <input type="checkbox" required={f.required} checked={customFormResponses[f.label] === 'true'} onChange={e => setCustomFormResponses({...customFormResponses, [f.label]: e.target.checked ? 'true' : 'false'})} className="absolute inset-0 opacity-0 cursor-pointer" />
                          {customFormResponses[f.label] === 'true' && <Check size={14} className="text-white font-black" />}
                        </div>
                        <span className="font-bold text-foreground select-none">{f.label} {f.required && <span className="text-rose-500">*</span>}</span>
                      </label>
                    ) : f.type === 'select' || f.type === 'dropdown' ? (
                      <div className="relative">
                        <select required={f.required} value={customFormResponses[f.label] || ''} onChange={e => setCustomFormResponses({...customFormResponses, [f.label]: e.target.value})} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer pr-10">
                          <option value="" disabled>Select an option</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none" size={20} />
                      </div>
                    ) : (
                      <input type={f.type || 'text'} required={f.required} value={customFormResponses[f.label] || ''} onChange={e => setCustomFormResponses({...customFormResponses, [f.label]: e.target.value})} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/20" />
                    )}
                  </div>
                ))}
            </div>
            <div className="pt-8 border-t border-border">
              <Button className="w-full py-7 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all" onClick={async () => {
                if (selectedEvent) {
                  const missingRequired = aiFields.some((f: any) => f.required && !customFormResponses[f.label]);
                  if (missingRequired) {
                    return toast.error("Please fill all required custom fields");
                  }
                  try {
                    const payload = {
                      customFormResponses: Object.keys(customFormResponses).length > 0 ? JSON.stringify(customFormResponses) : undefined
                    };
                    const res = await eventService.registerForEvent(selectedEvent.id, payload);
                    if (res.success) {
                      setIsRegistered(true);
                      setEvents(events.map((e: any) => e.id === selectedEvent.id ? { ...e, isRegistered: true, currentParticipants: (e.currentParticipants || 0) + 1 } : e));
                      toast.success("Successfully registered!");
                    }
                  } catch (e: any) {
                    toast.error(e.response?.data?.message || "Registration failed");
                  }
                }
              }}>Confirm Registration</Button>
            </div>
          </div>
        </div>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border-2 border-primary/20 p-12 rounded-[2.5rem] shadow-2xl shadow-primary/10 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-primary"></div>
           <div className="w-24 h-24 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <CheckCircle size={56} strokeWidth={2.5} />
           </div>
           <h3 className="text-4xl font-black text-foreground mb-4">Successfully Registered!</h3>
           <p className="text-muted-foreground font-bold text-lg mb-10 max-w-md mx-auto">You have successfully registered for {selectedEvent.title}. Check your My Events tab for details.</p>
           
           <div className="flex gap-4 max-w-md mx-auto">
             <Button variant="outline" className="flex-1 py-6 rounded-2xl font-bold text-lg border-2" onClick={() => setCurrentView('dashboard')}>Go to Dashboard</Button>
             <Button className="flex-1 py-6 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" onClick={() => { setCurrentView('event_details'); setStudentEventTab('info'); }}>View Event</Button>
           </div>
        </motion.div>
      )}
    </motion.div>
  );
};

  return (
    <>
      {/* Registration Details Modal */}
      <AnimatePresence>
      {selectedRegistrationForView && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-card w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 bg-accent/30 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black">Registration Details</h3>
                <p className="text-sm font-bold text-muted-foreground mt-1">Review student profile and submitted forms.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedRegistrationForView(null)} className="rounded-full hover:bg-rose-100 hover:text-rose-500"><X size={20} /></Button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 flex-grow">
              <section>
                <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2"><User size={16}/> Student Profile</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-accent/10 p-6 rounded-2xl border border-border">
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Full Name</p><p className="font-black text-foreground">{selectedRegistrationForView.studentName || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Enrollment</p><p className="font-bold text-foreground">{selectedRegistrationForView.enrollmentNo || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Email</p><p className="font-bold text-foreground truncate" title={selectedRegistrationForView.email}>{selectedRegistrationForView.email || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Phone</p><p className="font-bold text-foreground">{selectedRegistrationForView.phoneNumber || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Batch</p><p className="font-bold text-foreground">{selectedRegistrationForView.batchYear || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Year</p><p className="font-bold text-foreground">{selectedRegistrationForView.currentYear && selectedRegistrationForView.currentYear !== 'N/A' ? selectedRegistrationForView.currentYear : (selectedRegistrationForView.semester ? Math.ceil(parseInt(selectedRegistrationForView.semester)/2) : 'N/A')}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Semester</p><p className="font-bold text-foreground">{selectedRegistrationForView.semester || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Class/Section</p><p className="font-bold text-foreground">{selectedRegistrationForView.className || 'N/A'}</p></div>
                  <div><p className="text-xs font-bold text-muted-foreground uppercase mb-1">Registered At</p><p className="font-bold text-foreground">{selectedRegistrationForView.registeredAt ? new Date(selectedRegistrationForView.registeredAt).toLocaleString() : 'N/A'}</p></div>
                </div>
              </section>

              {selectedRegistrationForView.customFormResponses && (
                <section>
                  <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={16}/> Form Responses</h4>
                  <div className="space-y-4">
                    {Object.entries(JSON.parse(selectedRegistrationForView.customFormResponses)).map(([key, value]: [string, any], idx) => {
                      const formConfig = selectedEvent?.aiRegistrationFormConfig ? (typeof selectedEvent.aiRegistrationFormConfig === 'string' ? JSON.parse(selectedEvent.aiRegistrationFormConfig) : selectedEvent.aiRegistrationFormConfig) : [];
                      const isFile = formConfig.find((f: any) => f.label === key)?.type === 'file' || key.toLowerCase().includes('payment qr');
                      
                      return (
                        <div key={idx} className="bg-card border border-border p-5 rounded-2xl">
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-2">{key}</p>
                          {isFile ? (
                            <div className="mt-2">
                              {value ? (
                                <div className="flex flex-col items-start gap-4">
                                  <img src={getBannerUrl(value)} alt={key} className="w-48 h-48 object-cover rounded-xl border border-border shadow-sm" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', `<a href="${getBannerUrl(value)}" target="_blank" class="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-primary/90"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg> Download Document</a>`); }} />
                                  <Button variant="outline" size="sm" className="font-bold gap-2" onClick={() => window.open(getBannerUrl(value), '_blank')}><Eye size={14}/> View Full Size</Button>
                                </div>
                              ) : (
                                <p className="font-bold text-muted-foreground italic">No file uploaded</p>
                              )}
                            </div>
                          ) : (
                            <p className="font-black text-foreground text-lg whitespace-pre-wrap leading-relaxed">{value || 'N/A'}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Custom Field Modal */}
      <AnimatePresence>
      {showCustomFieldModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-4">Add Custom Field</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Field Label</label>
                <input type="text" className="w-full p-3 border border-border rounded-xl bg-background" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} placeholder="e.g., T-Shirt Size" />
              </div>
              <div>
                <label className="text-sm font-bold">Field Type</label>
                <select className="w-full p-3 border border-border rounded-xl bg-background font-medium" value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})}>
                  <option>Text</option>
                  <option>Number</option>
                  <option>Dropdown</option>
                  <option>Checkbox</option>
                  <option>Radio</option>
                  <option>Date</option>
                  <option>File Upload</option>
                  <option>Text Area</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setShowCustomFieldModal(false)}>Cancel</Button>
              <Button onClick={() => { if(newField.label) { setCustomFields([...customFields, newField]); setShowCustomFieldModal(false); setNewField({label: '', type: 'Text'}); } }}>Add Field</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Notice Modal */}
      <AnimatePresence>
      {showNoticeModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-4">{newNotice.id ? 'Edit Notice' : 'Publish Event Notification'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Title</label>
                <input type="text" className="w-full p-3 border border-border rounded-xl bg-background" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} placeholder="Notice Title" />
              </div>
              <div>
                <label className="text-sm font-bold">Description</label>
                <textarea className="w-full p-3 border border-border rounded-xl bg-background h-24" value={newNotice.description} onChange={e => setNewNotice({...newNotice, description: e.target.value})} placeholder="Notice details..." />
              </div>
              <div>
                <label className="text-sm font-bold">Attachment (Optional)</label>
                <input type="file" className="w-full p-3 border border-border rounded-xl bg-background font-medium" 
                       onChange={e => setNoticeFile(e.target.files ? e.target.files[0] : null)} />
                {newNotice.attachmentFileUrl && !noticeFile && <p className="text-xs text-blue-500 mt-1">Current attachment exists. Uploading a new one will replace it.</p>}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => { setShowNoticeModal(false); setNoticeFile(null); }}>Cancel</Button>
              <Button disabled={isUploadingNotice} onClick={async () => { 
                if(newNotice.title && newNotice.description) {
                  setIsUploadingNotice(true);
                  try {
                    let fileId = newNotice.attachmentFileId;
                    if (noticeFile) {
                      const uploadRes = await eventService.uploadFile(noticeFile);
                      if(uploadRes.success) {
                        fileId = uploadRes.data;
                      }
                    }
                    const payload = { title: newNotice.title, description: newNotice.description, attachmentFileId: fileId };
                    
                    if (newNotice.id) {
                      await eventService.updateNotice(newNotice.id, payload);
                    } else {
                      await eventService.publishNotice(selectedEvent.id, payload);
                    }
                    
                    fetchEventDetails(selectedEvent.id);
                    setShowNoticeModal(false); 
                    setNewNotice({title: '', description: '', attachmentFileId: null, id: null}); 
                    setNoticeFile(null);
                  } catch (e) {
                    console.error("Notice error", e);
                  } finally {
                    setIsUploadingNotice(false);
                  }
                }
              }}>{isUploadingNotice ? 'Saving...' : (newNotice.id ? 'Save Changes' : 'Publish Notice')}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Delete Notice Confirmation Modal */}
      <AnimatePresence>
      {noticeToDelete && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-black mb-2">Delete Notice?</h3>
            <p className="text-sm text-muted-foreground mb-6">Are you sure you want to permanently delete this notice? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-bold" onClick={() => setNoticeToDelete(null)}>Cancel</Button>
              <Button className="flex-1 font-bold bg-rose-600 hover:bg-rose-700 text-white" onClick={() => {
                eventService.deleteNotice(noticeToDelete).then(() => {
                  fetchEventDetails(selectedEvent.id);
                  setNoticeToDelete(null);
                  toast.success("Notice deleted");
                }).catch(() => {
                  toast.error("Failed to delete notice");
                });
              }}>Delete</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {showStartAttendanceModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-8 border-b border-border bg-primary/5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">Configure Attendance</h3>
                    <p className="text-sm font-bold text-muted-foreground mt-2">Set up the parameters for this attendance session.</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowStartAttendanceModal(false)} className="rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors">
                    <X size={24} />
                  </Button>
                </div>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Number of Unique Codes</label>
                    <input type="number" min={1} max={500} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-foreground focus:ring-2 focus:ring-primary/20" value={startAttendanceForm.uniqueCodeCount} onChange={(e) => setStartAttendanceForm({...startAttendanceForm, uniqueCodeCount: parseInt(e.target.value) || 0})} />
                    <p className="text-xs text-muted-foreground ml-1">Students will need one of these unique codes + the global code to mark attendance.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Timer Duration (Minutes)</label>
                    <input type="number" min={1} max={120} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-foreground focus:ring-2 focus:ring-primary/20" value={startAttendanceForm.timerDurationMinutes} onChange={(e) => setStartAttendanceForm({...startAttendanceForm, timerDurationMinutes: parseInt(e.target.value) || 0})} />
                  </div>
                  {selectedEvent?.includeInOverallAttendance && (
                    <div className="bg-accent/30 p-4 rounded-xl border border-border mt-4 space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={startAttendanceForm.isIncludedInOverall} onChange={(e) => setStartAttendanceForm({...startAttendanceForm, isIncludedInOverall: e.target.checked})} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                        <span className="font-bold text-sm">Include this session in Overall Attendance</span>
                      </label>

                      {startAttendanceForm.isIncludedInOverall && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Select Half</label>
                            <select value={startAttendanceForm.halfType} onChange={e => {
                              setStartAttendanceForm({...startAttendanceForm, halfType: e.target.value, selectedLectures: []});
                            }} className="w-full p-4 border border-border rounded-xl bg-background font-bold text-sm focus:ring-2 focus:ring-primary/20">
                              <option value="First Half">First Half</option>
                              <option value="Second Half">Second Half</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Select Lectures</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {startAttendanceForm.halfType === 'First Half' ? (
                                <>
                                  {['Lecture 1 – 50 minutes', 'Lecture 2 – 50 minutes', 'Lecture 3 – 50 minutes'].map(l => (
                                    <label key={l} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${startAttendanceForm.selectedLectures.includes(l) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`}>
                                      <input type="checkbox" checked={startAttendanceForm.selectedLectures.includes(l)} onChange={() => toggleLecture(l)} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                                      <span className="font-bold text-xs">{l}</span>
                                    </label>
                                  ))}
                                </>
                              ) : (
                                <>
                                  {['Lecture 1 – 50 minutes', 'Lecture 2 – 50 minutes', 'Lecture 3 – 45 minutes', 'Lecture 4 – 45 minutes'].map(l => (
                                    <label key={l} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${startAttendanceForm.selectedLectures.includes(l) ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent/50'}`}>
                                      <input type="checkbox" checked={startAttendanceForm.selectedLectures.includes(l)} onChange={() => toggleLecture(l)} className="w-4 h-4 rounded text-primary focus:ring-primary" />
                                      <span className="font-bold text-xs">{l}</span>
                                    </label>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-border bg-background flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowStartAttendanceModal(false)} className="px-6 py-4 rounded-2xl font-bold">Cancel</Button>
                <Button onClick={handleStartAttendance} className="px-8 py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 flex items-center gap-2">
                  <CheckSquare size={18} /> Confirm & Start
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-8 space-y-8 max-w-screen-2xl mx-auto pb-24 lg:pb-8">
      {currentView === 'dashboard' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderAdminDashboard()}
      {currentView === 'create_event' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderCreateEvent()}
      {currentView === 'event_details' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderAdminEventDetails()}
      
      {currentView === 'dashboard' && role === 'student' && renderStudentDashboard()}
      {currentView === 'event_details' && role === 'student' && renderStudentEventDetails()}
      {currentView === 'student_register' && role === 'student' && renderStudentRegisterFlow()}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {eventToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-card border border-border shadow-2xl rounded-[2rem] w-full max-w-md overflow-hidden relative">
              <div className="p-8 text-center relative z-10">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-2xl font-black mb-2 text-foreground">Delete Event?</h2>
                <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed max-w-[280px] mx-auto">
                  Are you absolutely sure? This action is permanent and will remove all associated registrations, attendance records, and notices.
                </p>
                <div className="flex gap-4">
                  <Button variant="outline" size="lg" className="flex-1 rounded-2xl font-bold bg-background hover:bg-accent hover:text-foreground border-border" onClick={() => setEventToDelete(null)}>Cancel</Button>
                  <Button variant="default" size="lg" className="flex-1 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 border-none" onClick={confirmDeleteEvent}>Yes, Delete</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
};

export default EventsModule;
