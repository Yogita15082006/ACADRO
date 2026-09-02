import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, Trash2, Search, X, 
  BookOpen, Users, Clock, GraduationCap, Calendar, 
  MessageSquare, Settings, UserCircle, Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '../context/AuthContext';
import { notificationService, type NotificationResponse } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';

// Module mapping for icons and colors
const TYPE_CONFIG: Record<string, { module: string, icon: React.ReactNode, color: string, priority: string }> = {
  'ATTENDANCE': { module: 'Attendance', icon: <Users size={16} />, color: 'text-blue-500 bg-blue-500/10', priority: 'warning' },
  'ASSIGNMENT': { module: 'Assignments', icon: <BookOpen size={16} />, color: 'text-amber-500 bg-amber-500/10', priority: 'primary' },
  'QUIZ': { module: 'Quiz', icon: <Clock size={16} />, color: 'text-indigo-500 bg-indigo-500/10', priority: 'warning' },
  'EXAMINATION': { module: 'Examination', icon: <GraduationCap size={16} />, color: 'text-rose-500 bg-rose-500/10', priority: 'destructive' },
  'EVENT': { module: 'Events', icon: <Calendar size={16} />, color: 'text-emerald-500 bg-emerald-500/10', priority: 'primary' },
  'EVENT_NOTICE': { module: 'Events', icon: <Calendar size={16} />, color: 'text-emerald-500 bg-emerald-500/10', priority: 'info' },
  'NOTICE': { module: 'Notice', icon: <MessageSquare size={16} />, color: 'text-orange-500 bg-orange-500/10', priority: 'info' },
  'SYSTEM': { module: 'System', icon: <Settings size={16} />, color: 'text-slate-500 bg-slate-500/10', priority: 'secondary' },
  'GENERAL': { module: 'General', icon: <Info size={16} />, color: 'text-slate-500 bg-slate-500/10', priority: 'info' }
};

const getBadgeColor = (priority: string) => {
  switch(priority) {
    case 'destructive': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'warning': return 'bg-warning/10 text-warning border-warning/20';
    case 'success': return 'bg-success/10 text-success border-success/20';
    case 'primary': return 'bg-primary/10 text-primary border-primary/20';
    case 'info': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'secondary': return 'bg-secondary/10 text-secondary border-secondary/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const formatTimeAgo = (dateStr: string) => {
  if (!dateStr) return 'Unknown';
  const diffMs = new Date().getTime() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffDays > 0) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  if (diffHours > 0) return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  if (diffMins > 0) return diffMins === 1 ? '1 min ago' : `${diffMins} mins ago`;
  return 'Just now';
};

interface NotificationPanelProps {
  onClose: () => void;
  onCountUpdate?: (count: number) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose, onCountUpdate }) => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterRead, setFilterRead] = useState('All'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleEnablePush = async () => {
    const success = await pushNotificationService.requestPermissionAndRegister();
    setPushEnabled(success);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications(0, 10);
      setNotifications(data?.content || []);
      setError(null);
    } catch (err) {
      setError('Unable to load notifications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getRouteForType = (type: string) => {
    const isStudent = role === 'student';
    const prefix = isStudent ? '/student' : '/admin';
    switch (type) {
      case 'ASSIGNMENT': return `${prefix}/assignments`;
      case 'NOTICE': return `${prefix}/notice`;
      case 'EVENT': 
      case 'EVENT_NOTICE': return `${prefix}/events`;
      case 'EXAMINATION': return `${prefix}/examinations`;
      case 'ATTENDANCE': return `${prefix}/attendance`;
      case 'QUIZ': return `${prefix}/quiz`;
      default: return null;
    }
  };

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await notificationService.markAsRead(id);
      if (onCountUpdate) {
        notificationService.getUnreadCount().then(onCountUpdate);
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await notificationService.markAllAsRead();
      if (onCountUpdate) onCountUpdate(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleClick = (notif: NotificationResponse) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    const route = getRouteForType(notif.type);
    if (route) {
      navigate(route);
    }
    onClose();
  };

  const filteredNotifications = useMemo(() => {
    return (notifications || []).filter(n => {
      const config = TYPE_CONFIG[n.type] || TYPE_CONFIG['GENERAL'];
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = filterModule === 'All' || config.module === filterModule;
      const matchesRead = filterRead === 'All' || 
                          (filterRead === 'Read' && n.isRead) || 
                          (filterRead === 'Unread' && !n.isRead);
      return matchesSearch && matchesModule && matchesRead;
    });
  }, [notifications, searchQuery, filterModule, filterRead]);

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;
  const modules = ['All', ...Array.from(new Set(Object.values(TYPE_CONFIG).map(c => c.module)))];

  return (
    <div className="fixed sm:absolute top-16 sm:top-14 left-4 right-4 sm:left-auto sm:-right-2 w-auto sm:w-[450px] bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-300 flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground text-lg tracking-tight">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-2 py-0.5 ml-2 shadow-sm">
              {unreadCount} New
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={handleMarkAllAsRead} title="Mark all as read">
            <Check className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden transition-colors" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!pushEnabled && (
        <div className="bg-primary/10 p-2.5 border-b border-primary/20 flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-2 overflow-hidden">
            <Bell className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs font-medium text-foreground truncate">Don't miss updates</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleEnablePush} className="h-7 text-[10px] font-bold border-primary/30 hover:bg-primary/20">
            Enable Push
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="p-3 border-b border-border bg-background space-y-3 z-10 relative shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search notifications..." 
            className="w-full bg-muted/40 border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <select 
            className="text-xs font-medium bg-muted/40 border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary/50 text-foreground cursor-pointer transition-colors hover:bg-muted/60"
            value={filterRead}
            onChange={(e) => setFilterRead(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>
          <select 
            className="text-xs font-medium bg-muted/40 border border-border rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary/50 text-foreground cursor-pointer transition-colors hover:bg-muted/60"
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
          >
            {modules.map(m => (
              <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2 bg-muted/10 custom-scrollbar relative min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-70">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive flex flex-col items-center">
            <p className="text-sm font-semibold">{error}</p>
            <Button variant="link" size="sm" onClick={fetchNotifications} className="mt-2 text-primary">Retry</Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 opacity-40" />
            </div>
            <p className="text-base font-semibold text-foreground">You're all caught up!</p>
            <p className="text-sm opacity-80 mt-1">No new notifications at the moment.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG['GENERAL'];
            const hasRoute = !!getRouteForType(notif.type);

            return (
            <div 
              key={notif.id} 
              className={`group p-4 rounded-xl border transition-all duration-200 ${hasRoute ? 'cursor-pointer' : ''} ${notif.isRead ? 'bg-background border-border/40 opacity-75 hover:opacity-100 hover:border-border hover:shadow-sm' : 'bg-background border-border shadow-sm hover:shadow-md hover:border-primary/30 relative overflow-hidden'}`}
              onClick={() => hasRoute ? handleClick(notif) : (!notif.isRead && handleMarkAsRead(notif.id))}
            >
              {!notif.isRead && (
                 <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              )}
              <div className="flex gap-4">
                <div className={`mt-1 p-2.5 rounded-xl shrink-0 h-fit transition-transform group-hover:scale-105 shadow-sm ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{config.module}</span>
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 rounded font-semibold uppercase tracking-wider border-0 ${getBadgeColor(config.priority)}`}>
                        {notif.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{formatTimeAgo(notif.createdAt)}</span>
                  </div>
                  <h4 className={`text-sm mb-1 truncate ${notif.isRead ? 'font-medium text-foreground/90' : 'font-bold text-foreground'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!notif.isRead && (
                    <button 
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      className="p-1.5 text-primary hover:bg-primary/10 transition-colors rounded-md mt-auto"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30 text-center backdrop-blur-sm sticky bottom-0 z-10">
        <Button variant="ghost" size="sm" className="w-full text-xs font-semibold h-8 text-primary hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => { navigate(`/${role}/notifications`); onClose(); }}>
          View All Notifications
        </Button>
      </div>
    </div>
  );
};
