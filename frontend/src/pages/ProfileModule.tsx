import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getAssetUrl } from '../lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Mail, Hash, Users, GraduationCap, Building, Moon, Sun, LogOut, Info, Key, Camera, Eye, EyeOff, Save, Smartphone, CheckCircle2, Lock, Edit } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { PersonalDetails } from '../components/profile/PersonalDetails';
import { AddressDetails } from '../components/profile/AddressDetails';
import { AcademicRecord } from '../components/profile/AcademicRecord';
import { ProfessionalDetails } from '../components/profile/ProfessionalDetails';
import { DocumentsProofs } from '../components/profile/DocumentsProofs';
import { Certifications } from '../components/profile/Certifications';
import { Achievements } from '../components/profile/Achievements';
import { FamilyDetails } from '../components/profile/FamilyDetails';
import { Internships } from '../components/profile/Internships';
import { Projects } from '../components/profile/Projects';
import { ConsentDeclaration } from '../components/profile/ConsentDeclaration';

export const ProfileModule = ({ viewingStudent, studentId, onBack }: { viewingStudent?: any, studentId?: string, onBack?: () => void }) => {
  const { user, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const studentIdParam = studentId || searchParams.get('studentId');

  const getSafeString = (val: any) => typeof val === 'object' && val !== null ? (val.name || val.id || JSON.stringify(val)) : val;

  const sanitizeProfileData = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeProfileData);
    if (typeof obj === 'object') {
      if ('id' in obj && 'name' in obj) return obj.name;
      const newObj: any = {};
      for (const key in obj) newObj[key] = sanitizeProfileData(obj[key]);
      return newObj;
    }
    return obj;
  };

  const [fetchedStudent, setFetchedStudent] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const targetId = viewingStudent?.userId || viewingStudent?.id || studentIdParam || user?.id;
    
    // If viewingStudent has basic data, show it immediately while loading the full profile
    if (viewingStudent) {
      setFetchedStudent(viewingStudent);
    }
    
    if (targetId) {
      // Only show loader if we don't have basic data from viewingStudent
      if (!viewingStudent) setIsLoadingProfile(true);
      
      const endpoint = (targetId === user?.id) ? `/v1/profile` : `/v1/profile/${targetId}`;
      api.get(endpoint).then(res => {
        setFetchedStudent(res.data?.data);
      }).catch(err => {
        console.error("Failed to fetch student profile", err);
      })
      .finally(() => setIsLoadingProfile(false));
    } else {
      setIsLoadingProfile(false);
    }
  }, [studentIdParam, viewingStudent, user?.id]);

  const isReadOnlyView = !!viewingStudent || !!studentIdParam;
  const rawProfileUser = fetchedStudent || user;
  const profileUser = sanitizeProfileData(rawProfileUser);

  // Profile Edit State
  const [email, setEmail] = useState(profileUser?.email || '');
  const [phone, setPhone] = useState(profileUser?.phone || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profileUser?.profilePictureUrl || '');
  const displayAvatar = (() => {
    if (!avatarPreview) return `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser?.firstName ? `${profileUser.firstName} ${profileUser.lastName || ''}`.trim() : profileUser?.name || 'User')}&background=4F46E5&color=fff&size=128`;
    if (avatarPreview.startsWith('http') || avatarPreview.startsWith('blob:') || avatarPreview.startsWith('data:')) return avatarPreview;
    const apiBase = api.defaults.baseURL?.replace(/\/api$/, '') || '';
    return avatarPreview.startsWith('/') ? `${apiBase}${avatarPreview}` : `${apiBase}/${avatarPreview}`;
  })();
  
  useEffect(() => {
    if (profileUser) {
      setEmail(profileUser.email || '');
      setPhone(profileUser.phone || '');
      setAvatarPreview(profileUser.profilePictureUrl || '');
    }
  }, [profileUser]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);


  const handleSectionUpdate = async (updatedData: any) => {
    try {
      const payload = { ...profileUser, ...updatedData };
      const res = await api.put('/v1/profile', payload);
      if (res.data?.data) {
        setFetchedStudent(res.data.data);
        window.dispatchEvent(new Event('sync-auth-profile'));
        toast.success("Profile updated successfully!");
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("Failed to update profile", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
      return false;
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.put('/v1/profile', { email, phone });
      if (response.data?.data) {
        setFetchedStudent(response.data.data);
        window.dispatchEvent(new Event('sync-auth-profile'));
        toast.success("Profile updated successfully!");
        setIsEditingProfile(false);
      }
    } catch (err: any) {
      toast.error("Failed to update profile");
    }
  };


  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    try {
      await api.post('/auth/change-password', {
         currentPassword,
         newPassword
      });
      toast.success("Password changed successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch(err: any) {
      toast.error(err.response?.data?.message || "Failed to change password. Ensure current password is correct.");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      api.post('/v1/profile/photo', formData).then(res => {
         setAvatarPreview(res.data.data.url);
         window.dispatchEvent(new Event('sync-auth-profile'));
         toast.success("Avatar updated");
      }).catch(() => toast.error("Upload failed"));
    }
  };

  if (isLoadingProfile || !profileUser) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading profile...</div>;
  }

  return (
    <div className={`space-y-6 animate-in fade-in duration-500 pb-10 mx-auto ${isReadOnlyView ? 'max-w-6xl' : 'max-w-5xl'}`}>
      
      {onBack && (
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Dashboard
          </Button>
        </div>
      )}

      {/* PROFESSIONAL PROFILE HEADER */}
      <Card className="bg-card border-border shadow-md overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/80 to-primary w-full relative">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="absolute bottom-[85px] sm:bottom-4 left-0 w-full px-6 sm:px-10 flex sm:justify-start justify-center">
            <div className="sm:pl-[150px] lg:pl-[180px]">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {profileUser.firstName ? `${profileUser.firstName} ${profileUser.lastName || ''}`.trim() : profileUser.name}
              </h1>
            </div>
          </div>
        </div>
        
        <CardContent className="px-6 sm:px-10 pb-8 relative pt-0">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center lg:items-start w-full justify-between">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start flex-1 w-full">
              
              {/* Avatar with Camera Overlay */}
              <div 
                className={`-mt-16 relative group/avatar shrink-0 z-10 ${!isReadOnlyView ? 'cursor-pointer' : ''}`}
                onClick={() => { if (!isReadOnlyView) fileInputRef.current?.click(); }}
              >
                <div className="relative">
                  <img 
                    src={displayAvatar} 
                    alt={profileUser.name} 
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background shadow-xl object-cover bg-muted transition-all duration-300 group-hover/avatar:scale-[1.02] ring-2 ring-primary/20"
                  />
                  {!isReadOnlyView && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-4 border-background rounded-full" title="Online"></div>
                  )}
                </div>
                {!isReadOnlyView && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white mb-1" />
                    <span className="text-white text-xs font-medium">Update Photo</span>
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
              </div>

              {/* Profile Info */}
              <div className="pt-2 sm:pt-4 flex-1 text-center sm:text-left space-y-3 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    {isReadOnlyView ? 'Student' : (
                       role === 'hod' ? 'Head of Department' :
                       role === 'both' ? 'Coordinator • Faculty' :
                       role === 'coordinator' ? 'Coordinator' :
                       role === 'faculty' ? 'Faculty' : 'Student'
                    )}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-center justify-center sm:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground mt-4">
                  {(isReadOnlyView || role === 'student') ? (
                    <>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>{getSafeString(profileUser.course) && getSafeString(profileUser.section) ? `${getSafeString(profileUser.course)} (Section: ${getSafeString(profileUser.section)})` : getSafeString(profileUser.className) || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{getSafeString(profileUser.department) || getSafeString(profileUser.departmentName) || getSafeString(profileUser.branch) || 'Not Specified'}</span>
                      </div>
                      {profileUser.enrollmentNumber && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          <span className="font-medium text-foreground">{profileUser.enrollmentNumber}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {profileUser.empId && (
                        <div className="flex items-center gap-2">
                          <Hash className="w-4 h-4" />
                          <span className="font-medium text-foreground">{profileUser.empId}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>
                          {(profileUser as any).departments && Array.isArray((profileUser as any).departments) && (profileUser as any).departments.length > 0
                            ? (profileUser as any).departments.map((d: any) => typeof d === 'string' ? d : d.name).join(' • ')
                            : getSafeString(profileUser.department)?.replace(/#/g, ' • ').replace(/\s*•\s*$/, '').trim() || 'Not Specified'}
                        </span>
                      </div>

                    </>
                  )}
                </div>
              </div>
            </div>

            {/* OVERALL ATTENDANCE CARD - Visible for students to all roles */}
            {(isReadOnlyView || role === 'student') && (
              <div className="mt-4 lg:mt-6 w-full lg:w-auto shrink-0 flex justify-center lg:justify-end">
                {(() => {
                  const percentage = profileUser.overallAttendance || 0;
                  let status = { label: 'Poor', color: 'text-red-500', stroke: 'stroke-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '🔴' };
                  if (percentage >= 90) status = { label: 'Excellent', color: 'text-green-500', stroke: 'stroke-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '🟢' };
                  else if (percentage >= 75) status = { label: 'Good', color: 'text-yellow-500', stroke: 'stroke-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '🟡' };
                  else if (percentage >= 60) status = { label: 'Average', color: 'text-orange-500', stroke: 'stroke-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🟠' };
                  
                  const conducted = profileUser.totalClassesConducted || 0;
                  const attended = profileUser.totalClassesAttended || 0;
                  const missed = Math.max(0, conducted - attended);
                  
                  let displayPercentage = percentage.toFixed(1) + '%';
                  
                  const radius = 36;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (percentage / 100) * circumference;

                  return (
                    <div className={`p-4 sm:p-5 rounded-xl border ${status.border} ${status.bg} backdrop-blur-sm shadow-sm flex flex-col sm:flex-row gap-5 items-center w-full lg:w-[22rem]`}>
                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                          <circle
                            className="stroke-muted/30"
                            strokeWidth="8"
                            fill="transparent"
                            r={radius}
                            cx="50"
                            cy="50"
                          />
                          <circle
                            className={`${status.stroke} drop-shadow-md transition-all duration-1000 ease-out`}
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="transparent"
                            r={radius}
                            cx="50"
                            cy="50"
                            style={{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }}
                          />
                        </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className={`text-base sm:text-lg font-bold tracking-tighter whitespace-nowrap ${status.color}`}>
                              {displayPercentage}
                            </span>
                          </div>
                      </div>
                      
                      <div className="flex-1 text-center sm:text-left space-y-2.5">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <span className="text-sm font-semibold tracking-wide text-foreground uppercase opacity-80">📊 Overall Attendance</span>
                        </div>
                        <div className={`text-xs font-semibold px-2.5 py-1 rounded-full w-fit mx-auto sm:mx-0 flex items-center gap-1.5 border bg-background/60 shadow-sm ${status.color} ${status.border}`}>
                          <span>{status.icon}</span> {status.label}
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-xs">
                          <div className="text-muted-foreground flex items-center">Conducted:</div>
                          <div className="font-semibold text-foreground text-right sm:text-left flex items-center">{conducted}</div>
                          
                          <div className="text-muted-foreground flex items-center">Attended:</div>
                          <div className="font-semibold text-green-600 dark:text-green-400 text-right sm:text-left flex items-center">{attended}</div>
                          
                          <div className="text-muted-foreground flex items-center">Missed:</div>
                          <div className="font-semibold text-red-600 dark:text-red-400 text-right sm:text-left flex items-center">{missed}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 ${isReadOnlyView ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-6`}>
        
        {/* LEFT COLUMN */}
        <div className={`${isReadOnlyView ? 'lg:col-span-1' : 'lg:col-span-2'} space-y-6`}>
          
          {isReadOnlyView || role === 'student' ? (
            <div className="space-y-6">
              <PersonalDetails data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <FamilyDetails data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <AddressDetails data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <AcademicRecord data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <ProfessionalDetails data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <Internships data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <Projects data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <DocumentsProofs data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <Certifications data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              <Achievements data={profileUser} readOnly={isReadOnlyView} onUpdate={handleSectionUpdate} />
              {!isReadOnlyView && <ConsentDeclaration onSave={() => {}} isSaving={false} />}
            </div>
          ) : (
            <>
              {/* CONTACT INFO (ADMIN ONLY) */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Contact Information</CardTitle>
                    <CardDescription>Update your email address and mobile number.</CardDescription>
                  </div>
                  <Button 
                    variant={isEditingProfile ? 'default' : 'outline'}
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="gap-2"
                  >
                    {isEditingProfile ? 'Cancel' : (
                      <>
                        <Edit className="w-4 h-4" /> Edit
                      </>
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-6">
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={!isEditingProfile}
                            className="pl-10 bg-background disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Mobile Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={!isEditingProfile}
                            className="pl-10 bg-background disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                    {isEditingProfile && (
                      <div className="flex justify-end">
                        <Button type="submit" className="gap-2">
                          <Save className="w-4 h-4" /> Save Changes
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* SECURITY */}
              <Card className="bg-card border-border shadow-sm mt-6">
                <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40">
                  <CardTitle className="text-xl">Security & Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handlePasswordUpdate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2 md:col-span-2 max-w-md">
                        <label className="text-sm font-semibold text-muted-foreground">Current Password</label>
                        <div className="relative group">
                          <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="pl-10 pr-10 bg-background"
                            required
                          />
                          <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 max-w-md">
                        <label className="text-sm font-semibold text-muted-foreground">New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-10 pr-10 bg-background"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2 max-w-md">
                        <label className="text-sm font-semibold text-muted-foreground">Confirm New Password</label>
                        <div className="relative group">
                          <CheckCircle2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10 bg-background"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <Button type="submit" disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}>
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

        </div>

        {/* RIGHT COLUMN */}
        {!isReadOnlyView && (
          <div className="space-y-6">
            
            {/* PREFERENCES */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40">
                <CardTitle className="text-xl">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Theme */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-muted-foreground">Theme Appearance</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10' : 'border-border bg-card hover:bg-muted text-muted-foreground hover:border-muted-foreground/30'}`}
                    >
                      <Sun className="w-4 h-4" /> Light
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10' : 'border-border bg-card hover:bg-muted text-muted-foreground hover:border-muted-foreground/30'}`}
                    >
                      <Moon className="w-4 h-4" /> Dark
                    </button>
                  </div>
                </div>


              </CardContent>
            </Card>

            {/* SESSION MANAGEMENT */}
            <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-destructive mb-1">Session Management</h3>
                  <p className="text-sm text-muted-foreground">Log out if you notice suspicious activity.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" /> Logout Current Device
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={logout}>
                    Log out all devices
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ABOUT */}
            <Card className="bg-card border-border shadow-sm">
               <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                      <Info className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-bold text-foreground">ACADRO</h4>
                    <p className="text-xs text-muted-foreground">Version 2.4.1 (Stable)</p>
                    <div className="flex gap-4 mt-4 pt-4 border-t border-border/40 w-full justify-center">
                      <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy</a>
                      <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms</a>
                      <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Licenses</a>
                    </div>
                  </div>
               </CardContent>
            </Card>

          </div>
        )}
      </div>


    </div>
  );
};

