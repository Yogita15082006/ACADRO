import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight, Sparkles, Eye, EyeOff, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { authService } from '../services/authService';
import { getAssetUrl } from '@/lib/utils';
import { profileService } from '../services/profileService';
import { dashboardService } from '../services/dashboardService';

export const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Profile Popup State
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [assignedSubjects, setAssignedSubjects] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const fetchProfileData = async (role: string) => {
    try {
      const profile = await profileService.getProfile();
      setProfileData(profile);
      setCurrentRole(role.toLowerCase());

      if (role.toLowerCase() === 'hod') {
        const hodDash = await dashboardService.getHodDashboard();
        setDashboardData(hodDash.data);
      } else if (role.toLowerCase() === 'faculty' || role.toLowerCase() === 'coordinator') {
        const subjects = await profileService.getFacultyAssignedSubjects();
        setAssignedSubjects(subjects);
      }
      
      setShowProfilePopup(true);
    } catch (err) {
      console.error("Failed to fetch profile data for popup", err);
      // Fallback: Just navigate directly if profile fetch fails
      if (role.toLowerCase() === 'student') navigate('/student');
      else navigate('/admin');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const loginRes = await login({ email: userId, password });
        if (loginRes && loginRes.success) {
            await fetchProfileData(loginRes.role);
        } else {
            setError(loginRes?.message || 'Login failed.');
        }
    } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
        setIsLoading(false);
    }
  };

  const resetRegistrationForm = () => {
      setRegEmail('');
      setRegPassword('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    setIsLoading(true);
    
    try {
        // Phase 1: Verify Account
        const verifyRes = await authService.verifyAccount({ email: regEmail });
        
        if (verifyRes.success) {
            // Phase 2: Activate Account
            const activateRes = await authService.activateAccount({ email: regEmail, password: regPassword });
            
            if (activateRes.success) {
                // Success! Switch to login mode and pre-fill credentials
                setIsRegistering(false);
                setUserId(regEmail);
                setPassword(regPassword);
                resetRegistrationForm();
                // Optionally show a success toast here
            } else {
                setError(activateRes.message || 'Failed to activate account.');
            }
        } else {
            setError(verifyRes.message || 'Verification failed.');
        }
    } catch (err: any) {
        setError(err.response?.data?.message || 'Verification failed. This account may not exist in ERP records.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-background p-6 font-sans relative overflow-x-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      {/* Background Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-10000"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-7000"></div>
      </div>

      <Card className="w-full max-w-5xl flex flex-col md:flex-row overflow-hidden min-h-[600px] max-h-[95vh] shadow-2xl shadow-primary/10 border border-border bg-card rounded-3xl z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Left Side - Branding */}
        <div className="w-full md:flex-1 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-8 md:p-12 flex flex-col justify-center md:justify-between text-white relative overflow-hidden shrink-0">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000 delay-150 fill-mode-both">
            <div className="hidden md:flex w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md items-center justify-center font-bold text-3xl mb-8 shadow-xl border border-white/20">
              A
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-2 md:mb-4 tracking-tight leading-tight">
              Welcome to <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white">AcroNexus</span>
            </h1>
            <p className="text-sm md:text-lg text-primary-foreground/90 leading-relaxed max-w-sm mt-2 md:mt-4 font-medium">
              The next-generation ERP platform for the Information Technology Department.
            </p>
          </div>
          
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both hidden md:block">
            <div className="flex flex-wrap gap-3 mb-6">
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 py-1.5 px-3 text-sm backdrop-blur-md shadow-sm">
                <Sparkles size={14} className="mr-1.5" /> Smart Analytics
              </Badge>
              <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-0 py-1.5 px-3 text-sm backdrop-blur-md shadow-sm">
                Real-time Sync
              </Badge>
            </div>
            <p className="text-sm text-primary-foreground/70 font-medium tracking-wide uppercase">Powered by Acropolis Institute</p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -top-[20%] -right-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-white/20 to-transparent blur-3xl"></div>
          <div className="absolute -bottom-[10%] -left-[20%] w-[300px] h-[300px] rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-3xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 p-6 md:p-14 bg-card overflow-y-auto custom-scrollbar">
          <div className="max-w-md w-full mx-auto min-h-full flex flex-col pt-8 pb-8 md:pt-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-10 text-center md:text-left mt-8 md:mt-0">
              <h2 className="text-3xl font-extrabold mb-2 text-foreground tracking-tight">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </h2>
              <p className="text-muted-foreground font-medium text-sm md:text-base">
                {isRegistering ? 'Register to access your portal.' : 'Enter your credentials to access your portal.'}
              </p>
            </div>



            {!isRegistering ? (
              // LOGIN FORM
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">User ID / Email / Enrollment No.</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="text" 
                      className="pl-10 h-12 bg-background border-border focus-visible:ring-primary/30 rounded-xl transition-all shadow-sm" 
                      placeholder="Email Address"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-muted-foreground">Password</label>
                    <span className="text-sm text-primary cursor-pointer font-semibold hover:underline">Forgot?</span>
                  </div>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      className="pl-10 pr-10 h-12 bg-background border-border focus-visible:ring-primary/30 rounded-xl transition-all shadow-sm" 
                      placeholder="Try 'password'"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-destructive text-sm p-4 bg-destructive/10 border border-destructive/20 rounded-xl font-medium animate-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-4 h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'} 
                  {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            ) : (
              // REGISTRATION FORM
              <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Work/Student Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type="email" 
                        className="pl-10 h-11 bg-background border-border rounded-xl focus-visible:ring-primary/30 shadow-sm" 
                        placeholder="Email Address"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        className="pl-10 h-11 bg-background border-border rounded-xl focus-visible:ring-primary/30 shadow-sm" 
                        placeholder="Create a strong password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>



                {error && (
                  <div className="text-destructive text-sm p-4 bg-destructive/10 border border-destructive/20 rounded-xl font-medium">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-4 h-12 text-base rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Register'} 
                  {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                </Button>
              </form>
            )}

            <p className="text-center mt-8 text-sm text-muted-foreground font-medium">
              {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span 
                className="text-primary font-bold cursor-pointer hover:underline"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
              >
                {isRegistering ? 'Sign In' : 'Create Account'}
              </span>
            </p>
          </div>
        </div>
      </Card>

      <Dialog open={showProfilePopup} onOpenChange={() => {}}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border rounded-2xl shadow-2xl [&>button]:hidden">
          <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
              {profileData?.profilePictureUrl ? (
                <img src={getAssetUrl(profileData.profilePictureUrl)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-white/80" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{profileData?.firstName} {profileData?.lastName}</h2>
              <p className="text-white/80 font-medium">{profileData?.email} • {profileData?.role?.replace('ROLE_', '')}</p>
              <p className="text-white/80 text-sm">
                {profileData?.departments?.length > 0 
                  ? profileData.departments.map((d: any) => d.name).join(', ') 
                  : (profileData?.departmentName || 'Department of Information Technology')}
              </p>
            </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">{(currentRole === 'faculty' || currentRole === 'hod' || currentRole === 'coordinator') ? 'Employee ID' : 'Enrollment No'}</span>
                  <span className="font-medium">{(currentRole === 'faculty' || currentRole === 'hod' || currentRole === 'coordinator') ? (profileData?.employeeId || 'Not available') : (profileData?.enrollmentNo || profileData?.instituteEnrollment || 'Not available')}</span>
                </div>
                {currentRole !== 'student' && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Phone Number</span>
                    <span className="font-medium">{profileData?.phone || 'Not available'}</span>
                  </div>
                )}
                {currentRole === 'student' && (
                  <>
                    <div>
                      <span className="text-muted-foreground block mb-1">Batch Year</span>
                      <span className="font-medium">{profileData?.batchYear || 'Not available'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Current Semester</span>
                      <span className="font-medium">{profileData?.semesterName || profileData?.currentSemester || 'Not available'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Role Specific Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Academic Assignments</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {currentRole === 'hod' && dashboardData && (
                  <>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block mb-1">Accessible Departments</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {profileData?.departments?.length > 0 ? (
                          profileData.departments.map((dept: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-muted/50 border-primary/20 text-primary">{dept.name}</Badge>
                          ))
                        ) : (
                          <span className="font-medium">Information Technology</span> // Fallback if no specific depts
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Total Faculty</span>
                      <span className="font-medium">{dashboardData.departmentFacultyCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Total Students</span>
                      <span className="font-medium">{dashboardData.departmentStudentCount}</span>
                    </div>
                    <div className="col-span-2 mt-2">
                      <span className="text-muted-foreground block mb-1">All Classes</span>
                      <span className="font-medium">
                        {profileData?.departments?.length > 0 
                          ? `All classes across: ${profileData.departments.map((d: any) => d.name).join(', ')}` 
                          : 'All applicable classes'}
                      </span>
                    </div>
                  </>
                )}
                
                {currentRole === 'faculty' && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-2">Assigned Classes & Subjects</span>
                    {assignedSubjects.length > 0 ? (
                      <div className="space-y-2">
                        {assignedSubjects.map((subject: any, idx: number) => (
                          <div key={idx} className="flex justify-between bg-muted/50 p-2 rounded border text-xs">
                            <span className="font-medium">{subject.subjectName}</span>
                            <span className="text-muted-foreground">{subject.className} ({subject.semester})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="font-medium text-muted-foreground">Not available</span>
                    )}
                  </div>
                )}

                {currentRole === 'coordinator' && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-2">Coordinator Assignments</span>
                    {profileData?.coordinatorAssignments?.length > 0 ? (
                      <div className="space-y-2">
                        {profileData.coordinatorAssignments.map((assignment: any, idx: number) => (
                          <div key={idx} className="flex justify-between bg-muted/50 p-2 rounded border text-xs items-center">
                            <span className="font-medium text-primary">Class: {assignment.className}</span>
                            <span className="text-muted-foreground">
                              Batch: {assignment.batch} | Yr: {assignment.academicYear} | Sem: {assignment.semester}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="font-medium text-muted-foreground">Not available</span>
                    )}
                  </div>
                )}
                
                {currentRole === 'student' && (
                  <div className="col-span-2 space-y-4">
                    <div>
                      <span className="text-muted-foreground block mb-2">Assigned Class & Section</span>
                      <div className="flex flex-wrap gap-2 text-xs">
                         <div className="bg-muted/50 p-2 rounded border"><span className="text-muted-foreground">Batch:</span> <span className="font-medium">{profileData?.batchYear || 'Not available'}</span></div>
                         <div className="bg-muted/50 p-2 rounded border"><span className="text-muted-foreground">Year:</span> <span className="font-medium">{profileData?.academicYearString || 'Not available'}</span></div>
                         <div className="bg-muted/50 p-2 rounded border"><span className="text-muted-foreground">Semester:</span> <span className="font-medium">{profileData?.semesterName || profileData?.currentSemester || 'Not available'}</span></div>
                         <div className="bg-muted/50 p-2 rounded border"><span className="text-muted-foreground">Class:</span> <span className="font-medium">{profileData?.className || profileData?.course || 'Not available'}</span></div>
                         <div className="bg-muted/50 p-2 rounded border"><span className="text-muted-foreground">Section:</span> <span className="font-medium">{profileData?.sectionName || profileData?.section || 'Not available'}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t flex justify-end">
            <Button 
              className="w-full sm:w-auto min-w-[200px]"
              onClick={() => currentRole === 'student' ? navigate('/student') : navigate('/admin')}
            >
              Open Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
