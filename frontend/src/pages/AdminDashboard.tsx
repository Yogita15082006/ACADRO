import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard } from 'lucide-react';
import { HodDashboardView } from '../components/dashboard/HodDashboardView';
import { CoordinatorDashboardView } from '../components/dashboard/CoordinatorDashboardView';
import { FacultyDashboardView } from '../components/dashboard/FacultyDashboardView';
import { getAssetUrl } from '@/lib/utils';

export const AdminDashboard = ({ previewUser }: { previewUser?: any }) => {
  const auth = useAuth();
  const user = previewUser || auth.user;
  
  if (!user) return null;

  // Format department name (similar to profile logic)
  const formatDepartmentName = (deptName: string | undefined) => {
    if (!deptName) return '';
    return deptName.replace(/#/g, ' • ').replace(/\s+•\s*$/, '').trim();
  };

  // Normalize role
  const role = user.role?.replace('ROLE_', '').toLowerCase() || auth.role;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border/50 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col gap-1">
          <p className="text-xl text-muted-foreground font-medium">
            Welcome back, <span className="text-foreground font-bold">{user.name || [user.firstName, user.lastName].filter(Boolean).join(' ')}</span>
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6" />
            {role === 'hod' ? 'Head of Department' : 
             role === 'both' ? 'Coordinator • Faculty' :
             role === 'coordinator' ? 'Class Coordinator' : 
             'Faculty'}
          </h1>
          {role === 'hod' && (
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              {user.departments ? user.departments.map((d: any) => d.name || d).join(' • ') : formatDepartmentName(user.department)}
            </p>
          )}
          {role === 'coordinator' && user.adminClasses && user.adminClasses.length > 0 && (
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              {user.adminClasses.map((c: any) => c.name || c).join(' • ')}
            </p>
          )}
          {role === 'faculty' && user.subjects && user.subjects.length > 0 && (
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-1">
              {user.subjects.slice(0, 3).map((s: any) => s.name || s).join(' • ')}{user.subjects.length > 3 ? ' • ...' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <img 
            src={user?.profilePictureUrl ? getAssetUrl(user.profilePictureUrl) : user?.avatar ? getAssetUrl(user.avatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.firstName || 'User')}&background=4F46E5&color=fff`} 
            alt="Profile" 
            className="w-16 h-16 rounded-full border-[3px] border-primary/20 object-cover shadow-sm"
          />
        </div>
      </div>

      {role === 'hod' && <HodDashboardView user={user} />}
      {role === 'coordinator' && <CoordinatorDashboardView user={user} />}
      {role === 'faculty' && <FacultyDashboardView user={user} />}
      {role === 'both' && (
        <div className="space-y-12">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2">Coordinator Overview</h2>
            <CoordinatorDashboardView user={user} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2">Faculty Overview</h2>
            <FacultyDashboardView user={user} />
          </div>
        </div>
      )}

    </div>
  );
};
