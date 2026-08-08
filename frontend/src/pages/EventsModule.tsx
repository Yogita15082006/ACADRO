import { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { CreateEventForm } from '../components/events/CreateEventForm';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, MapPin, Users, Clock, Plus, Search, Filter, Eye, Edit, Trash2, 
  TrendingUp, CheckCircle, ChevronRight, DownloadCloud, FileText, 
  Image as ImageIcon, CheckSquare, Check, X, Shield, QrCode, Monitor, 
  PieChart as PieChartIcon, Activity, Percent, AlertTriangle, Paperclip, CheckSquare2,
  Bell, Upload, FolderOpen, Link, Video, Send, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { mockData } from '../data/mockData';

// --- MOCK DATA ---
const MOCK_EVENTS = [
  {
    id: 'evt-1',
    title: 'TechNova Hackathon 2026',
    category: 'Hackathon',
    banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    venue: 'Main Auditorium',
    date: '2026-08-15',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    regDeadline: '2026-08-10',
    maxParticipants: 200,
    registeredCount: 145,
    status: 'Upcoming',
    description: 'A 24-hour hackathon to build innovative solutions for smart campuses. Cash prizes worth ₹50,000 for the winning teams.',
    isRegRequired: true,
    registrationMethod: 'Create Registration Form',
    registrationExternalLink: '',
    registrationFile: '',
    isAttRequired: true,
    organizer: 'Department of IT',
    rules: ['Must carry college ID', 'Bring your own laptops', 'Reporting time 8:30 AM'],
  },
  {
    id: 'evt-2',
    title: 'AI & Future of Work Seminar',
    category: 'Seminar',
    banner: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    venue: 'Seminar Hall 1',
    date: '2026-07-20',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    regDeadline: '2026-07-18',
    maxParticipants: 150,
    registeredCount: 150,
    status: 'Ongoing',
    description: 'Guest lecture by industry experts on how AI is reshaping the modern workplace. Mandatory for final year students.',
    isRegRequired: true,
    registrationMethod: 'External Registration Link',
    registrationExternalLink: 'https://forms.gle/ai-seminar-2026',
    registrationFile: '',
    isAttRequired: true,
    organizer: 'Placement Cell',
    rules: ['Formal attire required', 'Mandatory for final year'],
  },
  {
    id: 'evt-3',
    title: 'Annual Sports Meet',
    category: 'Sports',
    banner: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    venue: 'College Ground',
    date: '2026-05-10',
    startTime: '08:00 AM',
    endTime: '06:00 PM',
    regDeadline: '2026-05-05',
    maxParticipants: 500,
    registeredCount: 480,
    status: 'Completed',
    description: 'Inter-departmental sports competition featuring cricket, football, basketball, and athletics.',
    isRegRequired: true,
    registrationMethod: 'Upload Registration Form',
    registrationExternalLink: '',
    registrationFile: 'Sports_Meet_Registration.pdf',
    isAttRequired: false,
    organizer: 'Sports Committee',
    rules: ['Valid student ID', 'Proper sports kit required'],
  }
];

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
  useEffect(() => {
    if (selectedEvent && role !== 'student') {
      eventService.getEventRegistrations(selectedEvent.id).then(res => {
        if(res.success) setRegisteredStudents(res.data.content || []);
      });
    }
  }, [selectedEvent, role]);
  
  const [events, setEvents] = useState<any[]>([]);
  const fetchEvents = () => {
    eventService.getAllEvents().then(res => {
      if(res.success) setEvents(res.data.content);
    });
  };
  useEffect(() => { fetchEvents(); }, []);

  // States for student actions
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAttendanceSubmitted, setIsAttendanceSubmitted] = useState(false);
  const [customFormResponses, setCustomFormResponses] = useState<Record<string, string>>({});

  // Modals & Form Builder
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({ label: '', type: 'Text' });

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', attachment: 'PDF' });
  const [mockNotices, setMockNotices] = useState<any[]>([
    { id: 1, title: 'Venue Change', content: 'Shifted to Main Auditorium', type: 'PDF', date: 'Today, 10:30 AM' }
  ]);
  
  const [attendanceCode, _setAttendanceCode] = useState('');

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
  const renderAdminDashboard = () => {
    const timelineData = [
      { month: 'Jan', events: 2, reg: 150, part: 140 }, { month: 'Feb', events: 4, reg: 300, part: 280 }, { month: 'Mar', events: 6, reg: 450, part: 400 },
      { month: 'Apr', events: 3, reg: 200, part: 190 }, { month: 'May', events: 7, reg: 600, part: 580 }, { month: 'Jun', events: 5, reg: 400, part: 350 },
    ];
    
    const catData = [
      { name: 'Technical', value: 35, color: '#4F46E5' },
      { name: 'Cultural', value: 20, color: '#EC4899' },
      { name: 'Sports', value: 15, color: '#F59E0B' },
      { name: 'Seminar', value: 30, color: '#10B981' },
    ];

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
            { label: 'Total Events', value: '45', icon: <Calendar size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Upcoming Events', value: '12', icon: <TrendingUp size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Ongoing Events', value: '3', icon: <Clock size={18} />, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Completed Events', value: '30', icon: <CheckCircle size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Total Registrations', value: '4.2k', icon: <FileText size={18} />, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { label: 'Total Participants', value: '3.8k', icon: <Users size={18} />, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
            { label: 'Registration %', value: '92%', icon: <Percent size={18} />, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
            { label: 'Event Attendance %', value: '88%', icon: <PieChartIcon size={18} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
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

        {/* Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-foreground">Monthly Events Chart</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="events" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.2} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-foreground">Event Category Distribution</h3>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {catData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}/>
                  <Legend iconType="circle" verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-foreground">Registration & Participation Trend</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend iconType="circle" verticalAlign="top" height={36}/>
                  <Line type="monotone" name="Registrations" dataKey="reg" stroke="#8B5CF6" strokeWidth={3} dot={{r:4}} />
                  <Line type="monotone" name="Participants" dataKey="part" stroke="#10B981" strokeWidth={3} dot={{r:4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider mb-6 text-foreground">Upcoming Events Timeline</h3>
            <div className="space-y-4">
              {events.filter(e => e.status === 'Upcoming' || e.status === 'Ongoing').slice(0, 5).map(event => (
                <div key={event.id} className="flex gap-4 items-start relative pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary flex-shrink-0">
                    <span className="text-xs font-bold uppercase">{event.date.split('-')[1] || 'TBA'}</span>
                    <span className="text-lg font-black leading-none">{event.date.split('-')[2] || '--'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{event.title}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock size={14} /> {event.startTime || 'TBA'} • <MapPin size={14} /> {event.venue || 'TBA'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  const renderCreateEvent = () => (<CreateEventForm onBack={() => setCurrentView('dashboard')} onSuccess={() => { setCurrentView('dashboard'); fetchEvents(); }} />);

  const renderAdminEventDetails = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('dashboard')} className="rounded-full hover:bg-accent"><ChevronRight className="rotate-180" /></Button>
        <div>
          <h2 className="text-3xl font-black text-foreground">{selectedEvent.title}</h2>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Calendar size={14}/> {selectedEvent.date} • <MapPin size={14}/> {selectedEvent.venue}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto hide-scrollbar bg-card rounded-t-xl px-4 pt-2">
        <div className="flex gap-6 min-w-max">
          {[
            { id: 'info', label: 'Overview', icon: <FileText size={16} /> },
            { id: 'registrations', label: 'Registrations', icon: <Users size={16} /> },
            { id: 'attendance', label: 'Event Attendance', icon: <CheckSquare2 size={16} /> },
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <img src={selectedEvent.banner} alt="Banner" className="w-full h-64 object-cover" />
                  <div className="p-6">
                    <h3 className="text-xl font-black mb-4">Event Description</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">{selectedEvent.description}</p>
                  </div>
                </div>

                {/* Event Information */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border pb-2">Event Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Category', value: selectedEvent.category },
                      { label: 'Date', value: selectedEvent.date },
                      { label: 'Time', value: `${selectedEvent.startTime} - ${selectedEvent.endTime}` },
                      { label: 'Venue', value: selectedEvent.venue },
                      { label: 'Organizer', value: selectedEvent.organizer },
                      { label: 'Status', value: selectedEvent.status },
                    ].map((item, i) => (
                      <div key={i} className="bg-accent/30 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="font-bold text-foreground mt-1">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registration Info */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border pb-2">Registration Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-accent/30 p-3 rounded-xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Required</p><p className="font-bold text-foreground mt-1">{selectedEvent.isRegRequired ? 'Yes' : 'No'}</p></div>
                    <div className="bg-accent/30 p-3 rounded-xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Deadline</p><p className="font-bold text-foreground mt-1">{selectedEvent.regDeadline || 'N/A'}</p></div>
                    <div className="bg-accent/30 p-3 rounded-xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Max Slots</p><p className="font-bold text-foreground mt-1">{selectedEvent.maxParticipants}</p></div>
                    <div className="bg-accent/30 p-3 rounded-xl"><p className="text-[10px] font-bold text-muted-foreground uppercase">Registered</p><p className="font-bold text-primary mt-1">{selectedEvent.registeredCount}</p></div>
                  </div>
                  {selectedEvent.isRegRequired && (
                    <div className="bg-accent/30 p-4 rounded-xl border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Registration Method</p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-foreground">{selectedEvent.registrationMethod || 'Create Registration Form'}</p>
                        {selectedEvent.registrationMethod === 'External Registration Link' && selectedEvent.registrationExternalLink && (
                          <a href={selectedEvent.registrationExternalLink} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"><Link size={12}/> View Link</a>
                        )}
                        {selectedEvent.registrationMethod === 'Upload Registration Form' && selectedEvent.registrationFile && (
                          <div className="text-xs font-bold text-primary flex items-center gap-1"><FileText size={12}/> {selectedEvent.registrationFile}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attendance Settings */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border pb-2">Attendance Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center text-sm p-3 bg-accent/20 rounded-xl"><span className="text-muted-foreground font-bold">Attendance Required</span>{selectedEvent.isAttRequired ? <CheckCircle size={16} className="text-emerald-500"/> : <X size={16} className="text-rose-500"/>}</div>
                    <div className="flex justify-between items-center text-sm p-3 bg-accent/20 rounded-xl"><span className="text-muted-foreground font-bold">Included in Overall Att.</span><X size={16} className="text-rose-500"/></div>
                  </div>
                </div>

                {/* Resources */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border pb-2">Event Resources</h3>
                  <div className="flex flex-wrap gap-3">
                    {['Brochure.pdf', 'Schedule.pdf'].map((res, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 border border-border rounded-xl bg-accent/20 hover:bg-accent cursor-pointer transition-colors">
                        <FileText size={16} className="text-primary" />
                        <span className="text-sm font-bold">{res}</span>
                        <DownloadCloud size={14} className="text-muted-foreground ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                   <h3 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border pb-2">Quick Stats</h3>
                   <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground font-medium">Total Registrations</span><span className="font-black">{selectedEvent.registeredCount} / {selectedEvent.maxParticipants}</span></div>
                       <div className="w-full bg-accent rounded-full h-3"><div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${(selectedEvent.registeredCount/selectedEvent.maxParticipants)*100}%`}}></div></div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl text-center">
                         <p className="text-xs font-bold text-emerald-600 uppercase">Registered</p>
                         <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{selectedEvent.registeredCount}</p>
                       </div>
                       <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-xl text-center">
                         <p className="text-xs font-bold text-rose-600 uppercase">Remaining</p>
                         <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{selectedEvent.maxParticipants - selectedEvent.registeredCount}</p>
                       </div>
                     </div>
                   </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider border-b border-border pb-2">Rules & Guidelines</h3>
                  {selectedEvent.rules?.map((rule: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground font-medium">
                      <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" /> {rule}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* REGISTRATIONS TAB */}
          {adminEventTab === 'registrations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Registered</p>
                  <p className="text-3xl font-black text-foreground mt-2">{selectedEvent.registeredCount}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Remaining Seats</p>
                  <p className="text-3xl font-black text-emerald-500 mt-2">{selectedEvent.maxParticipants - selectedEvent.registeredCount}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Registration Percentage</p>
                  <p className="text-3xl font-black text-primary mt-2">{((selectedEvent.registeredCount/selectedEvent.maxParticipants)*100).toFixed(1)}%</p>
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
                        <th className="px-6 py-4">Class</th>
                        <th className="px-6 py-4">Registration Time</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {registeredStudents.map((student: any) => (
                        <tr key={student.id} className="hover:bg-accent/20 transition-colors">
                          <td className="px-6 py-4 font-bold text-foreground">{student.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">{student.enrollmentNumber}</td>
                          <td className="px-6 py-4 font-medium">{student.className}</td>
                          <td className="px-6 py-4 text-muted-foreground">{new Date().toLocaleString()}</td>
                          <td className="px-6 py-4"><span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded text-xs font-bold uppercase">Confirmed</span></td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="font-bold"><Eye size={14} className="mr-1"/> View</Button>
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
              <div className="lg:col-span-2 space-y-6">
                <div className="p-12 bg-card border border-border rounded-3xl shadow-xl text-center">
                  <QrCode size={64} className="mx-auto text-primary mb-6" />
                  <h3 className="text-3xl font-black mb-2">Conduct Event Attendance</h3>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">Generate a unique attendance code to project on the screen. Students will enter this code to mark their presence for the event.</p>
                  
                  <div className="flex flex-col items-center gap-4">
                    <Button size="lg" className="text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/20 bg-primary text-white w-full max-w-sm font-black">
                      Generate Attendance Code
                    </Button>
                    <div className="w-full max-w-sm mt-4 text-left space-y-4">
                      {attendanceCode && (
                        <div className="bg-accent/50 border border-primary/20 p-4 rounded-2xl text-center mb-6">
                          <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Active Code</p>
                          <p className="text-4xl font-black text-primary tracking-[0.5em]">{attendanceCode}</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Set Verification Question (Optional)</label>
                        <input type="text" placeholder="e.g., What was the topic of the second speaker?" className="w-full p-3 border border-border rounded-xl bg-background" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Attendance Timer</label>
                        <select className="w-full p-3 border border-border rounded-xl bg-background font-bold">
                          <option>15 Minutes</option>
                          <option>30 Minutes</option>
                          <option>1 Hour</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-8 text-center shadow-sm">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Present Students</p>
                  <p className="text-6xl font-black text-emerald-700 dark:text-emerald-300">120</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-8 text-center shadow-sm">
                  <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2">Absent Students</p>
                  <p className="text-6xl font-black text-rose-700 dark:text-rose-300">25</p>
                </div>
                <Button className="w-full py-6 rounded-2xl font-bold gap-2 text-lg" variant="outline"><Eye size={20}/> View Attendance Log</Button>
                <Button className="w-full py-6 rounded-2xl font-bold gap-2 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"><DownloadCloud size={20}/> Export Attendance CSV</Button>
              </div>
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
                {mockNotices.map((notice) => (
                  <div key={notice.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full">
                        Update
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-foreground mb-2">{notice.title}</h4>
                    <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">{notice.content}</p>
                    
                    {notice.type !== 'None' && (
                      <div className="mb-6 flex gap-2">
                        <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-accent/30 text-xs font-bold w-max">
                          <Paperclip size={14} className="text-blue-500" /> attachment.{notice.type.toLowerCase()}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground font-bold">Published: {notice.date}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="font-bold"><Edit size={14} className="mr-1"/> Edit</Button>
                        <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 font-bold" onClick={() => setMockNotices(mockNotices.filter(n => n.id !== notice.id))}><Trash2 size={14} className="mr-1"/> Delete</Button>
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
          { label: 'Registered Events', value: '4', icon: <FileText size={18} />, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Events Attended', value: '3', icon: <CheckCircle size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Events Missed', value: '1', icon: <X size={18} />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
          { label: 'Attendance %', value: '75%', icon: <Percent size={18} />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
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
                {myEventsTab === 'registered' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length > 0 && renderEventCard(events[0], false)}
                  </div>
                )}
                {myEventsTab === 'completed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.length > 2 && renderEventCard(events[2], false)}
                  </div>
                )}
                {(myEventsTab === 'upcoming' || myEventsTab === 'missed') && (
                  <div className="text-center py-20 bg-card border border-border rounded-3xl">
                    <Calendar size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-bold text-lg">No {myEventsTab} events found.</p>
                  </div>
                )}
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
          <img src={selectedEvent.banner} alt="Banner" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
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
                  <ul className="space-y-3">
                    {selectedEvent.rules?.map((rule: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium bg-accent/30 p-3 rounded-xl border border-border">
                        <CheckCircle size={20} className="text-primary shrink-0" /> {rule}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-3xl p-8 shadow-lg text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-6">Event Organizer</h4>
                  <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-lg">
                    <Users size={32} className="text-foreground" />
                  </div>
                  <p className="font-black text-xl text-foreground mb-1">{selectedEvent.organizer}</p>
                  <p className="text-sm font-bold text-muted-foreground mb-6">AcroNexus Platform</p>
                  
                  <div className="bg-accent/50 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Registration Deadline</p>
                    <p className="font-black text-rose-500">{selectedEvent.regDeadline}</p>
                  </div>
                  
                  <div className="bg-accent/50 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Participants</p>
                    <p className="font-black text-foreground">{selectedEvent.registeredCount} / {selectedEvent.maxParticipants}</p>
                  </div>

                  {selectedEvent.registrationMethod === 'Upload Registration Form' && selectedEvent.registrationFile && (
                    <Button variant="outline" className="w-full py-6 rounded-xl font-bold gap-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors mb-4"><DownloadCloud size={18}/> Download Registration Form</Button>
                  )}
                  
                  {selectedEvent.registrationMethod === 'External Registration Link' && selectedEvent.registrationExternalLink ? (
                    <Button className="w-full py-6 rounded-xl font-black text-lg gap-2 bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20" onClick={() => window.open(selectedEvent.registrationExternalLink, '_blank')}><Link size={18}/> Go to Registration Link</Button>
                  ) : selectedEvent.registrationMethod !== 'Upload Registration Form' ? (
                    <Button className="w-full py-6 rounded-xl font-black text-lg gap-2 bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/20" onClick={() => setCurrentView('student_register')}><CheckSquare size={18}/> Register for Event</Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {studentEventTab === 'attendance' && (
            <div className="max-w-xl mx-auto text-center py-16 space-y-8">
              {!isAttendanceSubmitted ? (
                <div className="bg-card border border-border p-10 rounded-[2.5rem] shadow-2xl shadow-primary/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                  <Shield size={56} className="mx-auto text-primary mb-6" />
                  <h3 className="text-3xl font-black mb-3 text-foreground">Submit Attendance</h3>
                  <p className="text-muted-foreground mb-10 font-medium">Enter the unique code provided by the organizer and answer the verification question to confirm your presence.</p>
                  
                  <div className="space-y-6 text-left mb-8">
                    <div>
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2 block mb-2">Unique Attendance Code</label>
                      <input type="text" placeholder="ENTER 6-DIGIT CODE" className="w-full p-5 text-center text-3xl font-black tracking-[0.5em] border-2 border-border rounded-2xl bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 uppercase transition-all shadow-inner" maxLength={6} />
                    </div>
                    <div>
                      <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2 block mb-2">Verification Question: What was the main topic?</label>
                      <input type="text" placeholder="Your answer..." className="w-full p-4 border-2 border-border rounded-2xl bg-background focus:border-primary focus:ring-4 focus:ring-primary/20 font-bold transition-all" />
                    </div>
                  </div>
                  
                  <Button className="w-full py-7 rounded-2xl text-xl font-black bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 transition-all" onClick={() => setIsAttendanceSubmitted(true)}>Submit Attendance</Button>
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
               {mockNotices.map((notice) => (
                 <div key={notice.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                    <div className="pl-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-full">
                          Update
                        </span>
                        <p className="text-xs text-muted-foreground font-bold">{notice.date}</p>
                      </div>
                      <h4 className="text-2xl font-black text-foreground mb-3">{notice.title}</h4>
                      <p className="text-base text-muted-foreground mb-6 font-medium leading-relaxed">{notice.content}</p>
                      
                      {notice.type !== 'None' && (
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-3 p-3 border border-border rounded-xl bg-accent/30 font-bold hover:bg-accent cursor-pointer transition-colors w-max pr-6">
                            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                               <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-sm">attachment.{notice.type.toLowerCase()}</p>
                              <p className="text-xs text-muted-foreground font-medium">1.2 MB</p>
                            </div>
                            <DownloadCloud size={16} className="ml-4 text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
               ))}
             </div>
          )}
        </div>
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
            <img src={selectedEvent.banner} alt="Banner" className="w-full h-full object-cover" />
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
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Full Name</label>
                <input type="text" value={user?.name || 'Rahul Kumar'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Enrollment No.</label>
                <input type="text" value={user?.enrollmentNumber || '0827IT201010'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Email Address</label>
                <input type="email" value={user?.email || 'student@acropolis.in'} disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Department</label>
                <input type="text" value="Information Technology" disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">Class</label>
                <input type="text" value="IT-1" disabled className="w-full p-4 border border-border rounded-2xl bg-accent/50 cursor-not-allowed font-bold text-foreground shadow-sm" />
              </div>
              {aiFields.map((f: any, idx: number) => (
                <div key={idx} className="space-y-2 col-span-2">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-wider ml-1">{f.label} {f.required && <span className="text-rose-500">*</span>}</label>
                  {f.type === 'textarea' ? (
                    <textarea required={f.required} value={customFormResponses[f.label] || ''} onChange={e => setCustomFormResponses({...customFormResponses, [f.label]: e.target.value})} className="w-full p-4 border border-border rounded-2xl bg-background font-bold text-foreground shadow-sm focus:ring-2 focus:ring-primary/20" rows={3}></textarea>
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
            <h3 className="text-xl font-black mb-4">Publish Event Notification</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Title</label>
                <input type="text" className="w-full p-3 border border-border rounded-xl bg-background" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} placeholder="Notice Title" />
              </div>
              <div>
                <label className="text-sm font-bold">Description</label>
                <textarea className="w-full p-3 border border-border rounded-xl bg-background h-24" value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} placeholder="Notice details..." />
              </div>
              <div>
                <label className="text-sm font-bold">Attachment Type</label>
                <select className="w-full p-3 border border-border rounded-xl bg-background font-medium" value={newNotice.attachment} onChange={e => setNewNotice({...newNotice, attachment: e.target.value})}>
                  <option>None</option>
                  <option>PDF</option>
                  <option>DOC</option>
                  <option>PPT</option>
                  <option>Images</option>
                  <option>ZIP</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setShowNoticeModal(false)}>Cancel</Button>
              <Button onClick={() => { 
                if(newNotice.title) {
                  setMockNotices([{id: Date.now(), title: newNotice.title, content: newNotice.content, type: newNotice.attachment, date: 'Just Now'}, ...mockNotices]); 
                  setShowNoticeModal(false); 
                  setNewNotice({title: '', content: '', attachment: 'None'}); 
                }
              }}>Publish Notice</Button>
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
    </div>
    </>
  );
};

export default EventsModule;
