import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getAssetUrl } from '@/lib/utils';
import {
  LayoutDashboard, Users,
  Calendar, Bell, LogOut, Moon, Sun, UserCircle, Menu, GraduationCap, CheckSquare, ClipboardList, Library, FolderOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { NotificationPanel } from './NotificationPanel';
import { notificationService } from '../services/notificationService';
import logoImg from '../assets/logo.jpg';
import dashboardLogo from '../assets/dashboard-logo.jpg';
import { pushNotificationService } from '../services/pushNotificationService';

export const Layout = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await pushNotificationService.unregisterToken();
    } catch(e) {}
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', roles: ['hod', 'coordinator', 'faculty', 'both'] },
    ...(role === 'hod' || role === 'coordinator' || role === 'faculty' || role === 'both' ? [{ to: '/admin/classes', icon: <Library size={18} />, label: 'Classes', roles: ['hod', 'coordinator', 'faculty', 'both'] }] : []),
    { to: '/admin/academic-resources', icon: <FolderOpen size={18} />, label: 'Academic Resources', roles: ['hod', 'coordinator', 'faculty', 'both'] },
    ...(role === 'hod' ? [{ to: '/admin/students', icon: <GraduationCap size={18} />, label: 'Students', roles: ['hod'] }] : []),
    ...(role === 'hod' ? [{ to: '/admin/faculty-management', icon: <Users size={18} />, label: 'Faculty Management', roles: ['hod'] }] : []),
    ...(role === 'coordinator' || role === 'faculty' || role === 'both' ? [{ to: '/admin/students', icon: <GraduationCap size={18} />, label: 'Students', roles: ['coordinator', 'faculty', 'both'] }] : []),
    ...(role !== 'hod' ? [{ to: '/admin/attendance', icon: <CheckSquare size={18} />, label: 'Attendance', roles: ['coordinator', 'faculty', 'both'] }] : []),
    ...(role === 'hod' || role === 'coordinator' || role === 'both' ? [{ to: '/admin/faculty-activity', icon: <ClipboardList size={18} />, label: 'Faculty Activity', roles: ['hod', 'coordinator', 'both'] }] : []),
    { to: '/admin/examinations', icon: <GraduationCap size={18} />, label: 'Examinations', roles: ['hod', 'coordinator', 'faculty', 'both'] },
    { to: '/admin/events', icon: <Calendar size={18} />, label: 'Events', roles: ['hod', 'coordinator', 'faculty', 'both'] },
    { to: '/admin/notice', icon: <Bell size={18} />, label: 'Notices', roles: ['hod', 'coordinator', 'faculty', 'both'] },
    { to: '/admin/profile', icon: <UserCircle size={18} />, label: 'Profile', roles: ['hod', 'coordinator', 'faculty', 'both'] },
  ];

  const studentLinks = [
    { to: '/student', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/student/classes', icon: <Library size={18} />, label: 'Classes' },
    { to: '/student/academic-resources', icon: <FolderOpen size={18} />, label: 'Academic Resources' },
    { to: '/student/attendance', icon: <Users size={18} />, label: 'Attendance' },
    { to: '/student/examinations', icon: <GraduationCap size={18} />, label: 'Examinations' },
    { to: '/student/events', icon: <Calendar size={18} />, label: 'Events' },
    { to: '/student/notice', icon: <Bell size={18} />, label: 'Notices' },
    { to: '/student/profile', icon: <UserCircle size={18} />, label: 'Profile' },
  ];

  const isStaff = ['admin', 'hod', 'coordinator', 'faculty', 'both'].includes(role);
  const links = isStaff ? adminLinks : studentLinks;

  // Determine current page title for the header
  const currentLink = links.find(link => {
    if (link.to === '/admin' || link.to === '/student') {
      return location.pathname === link.to;
    }
    return location.pathname.startsWith(link.to);
  });
  const pageTitle = currentLink ? currentLink.label : 'Overview';

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      {/* Mobile Sidebar Overlay/Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Premium Enterprise */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar w-[240px] flex-shrink-0 border-r border-border transition-transform duration-300 print:hidden",
        isMobileSidebarOpen ? "translate-x-0 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border flex-shrink-0">
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center shadow-sm overflow-hidden shrink-0 border border-border/50">
            <img src={dashboardLogo} alt="ACADRO Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-lg tracking-tight flex items-center leading-none mb-0.5">
              <span className="text-blue-600 font-bold">AC</span>
              <span className="text-foreground font-normal">AD</span>
              <span className="text-blue-600 font-bold">RO</span>
            </h2>
            <p className="text-[9px] text-muted-foreground font-medium leading-tight truncate">Academic & Department<br/>Management System</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/student'}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-md transition-all duration-150 group",
                isActive
                  ? "bg-accent/50 text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={cn(
                    "transition-colors",
                    "group-hover:text-foreground",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {link.icon}
                  </div>
                  {link.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border bg-sidebar">
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors cursor-pointer mb-1" onClick={() => navigate(isStaff ? '/admin/profile' : '/student/profile')}>
            <img
              src={user?.profilePictureUrl ? getAssetUrl(user.profilePictureUrl) : user?.avatar ? getAssetUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || (user?.firstName ? (user.firstName + ' ' + (user.lastName || '')) : 'Student'))}&background=4F46E5&color=fff`}
              alt="Profile"
              className="w-8 h-8 rounded-full ring-1 ring-border object-cover"
            />
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold truncate text-foreground">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user?.name || 'User')}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {role === 'hod' ? 'Head of Department' :
                  role === 'both' ? 'Coordinator / Faculty' :
                    role === 'coordinator' ? 'Coordinator' :
                      role === 'faculty' ? 'Faculty' :
                        role === 'student' ? 'Student' : 'Administrator'}
              </p>
            </div>
          </div>

          <div className="flex gap-1 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-full flex rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">


        {/* Sticky Top Header */}
        <header className="h-14 flex-shrink-0 bg-navbar/95 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300 print:hidden">
          <div className="flex items-center gap-2 md:gap-4 overflow-hidden md:overflow-visible">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden hover:bg-accent/30 text-muted-foreground hover:text-foreground h-9 w-9 shrink-0"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
            <h1 className="text-base md:text-lg font-semibold text-foreground tracking-tight truncate md:overflow-visible md:whitespace-normal">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border">
              <Calendar size={13} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-md w-9 h-9 md:w-8 md:h-8 border-border shadow-sm transition-colors",
                  showNotifications ? "bg-accent text-accent-foreground" : "bg-background hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={14} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground ring-2 ring-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <NotificationPanel 
                    onClose={() => {
                      setShowNotifications(false);
                      fetchUnreadCount();
                    }} 
                    onCountUpdate={setUnreadCount} 
                  />
                </>
              )}
            </div>

            <div
              className="flex items-center gap-2 cursor-pointer hover:bg-accent/30 p-1 md:p-1.5 md:pr-3 rounded-full md:rounded-md transition-colors shrink-0 md:ml-1"
              onClick={() => navigate(isStaff ? '/admin/profile' : '/student/profile')}
            >
              <img
                src={user?.profilePictureUrl ? getAssetUrl(user.profilePictureUrl) : user?.avatar ? getAssetUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || (user?.firstName ? (user.firstName + ' ' + (user.lastName || '')) : 'Student'))}&background=4F46E5&color=fff`}
                alt="Profile"
                className="w-9 h-9 md:w-8 md:h-8 rounded-full ring-2 ring-primary/20 object-cover"
              />
              <span className="text-sm font-semibold text-foreground hidden md:block">
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className={cn(
            "max-w-7xl mx-auto w-full animate-in fade-in duration-300 pb-12"
          )}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
