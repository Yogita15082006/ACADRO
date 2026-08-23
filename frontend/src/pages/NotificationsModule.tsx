import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService, type NotificationResponse } from '../services/notificationService';
import { 
  Bell, Check, X, BookOpen, Users, Clock, 
  GraduationCap, Calendar, MessageSquare, Settings, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG: Record<string, { module: string, icon: React.ReactNode, color: string, priority: string }> = {
  'ATTENDANCE': { module: 'Attendance', icon: <Users size={18} />, color: 'text-blue-500 bg-blue-500/10', priority: 'warning' },
  'ASSIGNMENT': { module: 'Assignments', icon: <BookOpen size={18} />, color: 'text-amber-500 bg-amber-500/10', priority: 'primary' },
  'QUIZ': { module: 'Quiz', icon: <Clock size={18} />, color: 'text-indigo-500 bg-indigo-500/10', priority: 'warning' },
  'EXAMINATION': { module: 'Examination', icon: <GraduationCap size={18} />, color: 'text-rose-500 bg-rose-500/10', priority: 'destructive' },
  'EVENT': { module: 'Events', icon: <Calendar size={18} />, color: 'text-emerald-500 bg-emerald-500/10', priority: 'primary' },
  'EVENT_NOTICE': { module: 'Events', icon: <Calendar size={18} />, color: 'text-emerald-500 bg-emerald-500/10', priority: 'info' },
  'NOTICE': { module: 'Notice', icon: <MessageSquare size={18} />, color: 'text-orange-500 bg-orange-500/10', priority: 'info' },
  'SYSTEM': { module: 'System', icon: <Settings size={18} />, color: 'text-slate-500 bg-slate-500/10', priority: 'secondary' },
  'GENERAL': { module: 'General', icon: <Info size={18} />, color: 'text-slate-500 bg-slate-500/10', priority: 'info' }
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
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', 
    hour: 'numeric', minute: '2-digit', hour12: true 
  });
};

export const NotificationsModule = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const size = 20;

  const fetchNotifications = async (currentPage: number) => {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications(currentPage, size);
      setNotifications(data?.content || []);
      setTotalPages(data?.totalPages || 1);
      setError(null);
    } catch (err) {
      setError('Unable to load notifications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

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
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await notificationService.markAsRead(id);
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await notificationService.markAllAsRead();
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
  };

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Stay updated with your latest academic activities
              {unreadCount > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0">
                  {unreadCount} Unread on this page
                </Badge>
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
          <Check size={16} /> Mark all as read
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground">All Notifications</h2>
        </div>

        <div className="p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-70">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-foreground">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-destructive flex flex-col items-center">
              <p className="text-sm font-semibold">{error}</p>
              <Button variant="link" size="sm" onClick={() => fetchNotifications(page)} className="mt-2 text-primary">Retry</Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-lg font-semibold text-foreground">You're all caught up!</p>
              <p className="text-sm opacity-80 mt-1">No new notifications at the moment.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG['GENERAL'];
              const hasRoute = !!getRouteForType(notif.type);

              return (
                <div 
                  key={notif.id} 
                  className={`group p-4 md:p-5 rounded-xl border transition-all duration-200 ${hasRoute ? 'cursor-pointer' : ''} ${notif.isRead ? 'bg-background border-border/40 opacity-80 hover:opacity-100 hover:border-border hover:shadow-sm' : 'bg-background border-border shadow-md hover:shadow-lg hover:border-primary/40 relative overflow-hidden'}`}
                  onClick={() => hasRoute ? handleClick(notif) : (!notif.isRead && handleMarkAsRead(notif.id))}
                >
                  {!notif.isRead && (
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                  )}
                  <div className="flex flex-col md:flex-row gap-4 md:items-start">
                    <div className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105 shadow-sm w-fit ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{config.module}</span>
                          <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider border-0 ${getBadgeColor(config.priority)}`}>
                            {notif.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <h4 className={`text-base mb-1 ${notif.isRead ? 'font-medium text-foreground/90' : 'font-bold text-foreground'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex justify-end md:flex-col md:justify-between opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-2 md:mt-0">
                      {!notif.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="p-2 text-primary hover:bg-primary/10 transition-colors rounded-lg flex items-center gap-2 text-sm font-medium"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                          <span className="md:hidden">Mark as read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1 || loading}
                className="gap-1"
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
