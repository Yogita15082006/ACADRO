import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import { useMetadata } from '../../hooks/useMetadata';
import { facultyProfileService, type FacultyProfileData } from '../../services/facultyProfileService';
import { toast } from 'sonner';
import {
  Briefcase,
  GraduationCap,
  History,
  TrendingUp,
  BookOpen,
  Users,
  Layers,
  Users2,
  FileCheck,
  ChevronLeft,
  Mail,
  Phone,
  Building,
  Hash,
  Shield,
  Sparkles,
  Printer,
  Download,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { getAssetUrl } from '@/lib/utils';
import { generateFacultyProfilePDF } from '../../utils/facultyReportGenerator';
import { FacultyProfilePrintModal } from './FacultyProfilePrintModal';
import { DepartmentFacultyPrintModal } from './DepartmentFacultyPrintModal';

// Import Tab Components
import { FacultyPersonalEmployment } from './FacultyPersonalEmployment';
import { FacultyQualifications } from './FacultyQualifications';
import { FacultyExperienceRetention } from './FacultyExperienceRetention';
import { FacultyPromotionHistory } from './FacultyPromotionHistory';
import { FacultyResearchPublications } from './FacultyResearchPublications';
import { FacultyResourcePerson } from './FacultyResourcePerson';
import { FacultyWorkload } from './FacultyWorkload';
import { FacultyClassStrength } from './FacultyClassStrength';
import { FacultyDocumentsPhoto } from './FacultyDocumentsPhoto';

interface FacultyProfileWorkspaceProps {
  facultyId?: string;
  onBack?: () => void;
}

export const FacultyProfileWorkspace: React.FC<FacultyProfileWorkspaceProps> = ({
  facultyId,
  onBack
}) => {
  const { user, role } = useAuth();
  const { departmentsList, academicYearsList } = useMetadata();

  const isHod = role === 'hod' || role === 'admin';
  const isCoordinator = role === 'coordinator';
  const targetFacultyId = facultyId || user?.id;
  const isViewingSelf = targetFacultyId === user?.id;

  const [activeTab, setActiveTab] = useState<string>('personal');
  const [profileData, setProfileData] = useState<FacultyProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Report & Print Modals State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeptPrintModalOpen, setIsDeptPrintModalOpen] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const handleDownloadDeptExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      await facultyProfileService.downloadDepartmentExcel();
      toast.success('Department faculty report downloaded successfully (.xlsx)');
    } catch (e: any) {
      console.error('Download excel error', e);
      toast.error(e.response?.data?.message || 'Failed to download department Excel report');
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const fetchProfile = async () => {
    if (!targetFacultyId) return;
    setLoading(true);
    try {
      const data = isViewingSelf
        ? await facultyProfileService.getMyProfile()
        : await facultyProfileService.getProfileById(targetFacultyId);
      setProfileData(data);
    } catch (e: any) {
      console.error('Failed to fetch faculty profile', e);
      toast.error(e.response?.data?.message || 'Failed to load faculty profile details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetFacultyId]);

  const handleSaveProfile = async (updatedFields: Partial<FacultyProfileData>) => {
    try {
      const updated = isViewingSelf && !isHod
        ? await facultyProfileService.updateMyProfile(updatedFields)
        : await facultyProfileService.updateProfileById(targetFacultyId, updatedFields);
      setProfileData(updated);
      toast.success('Profile updated successfully!');
      return true;
    } catch (e: any) {
      console.error('Update profile error', e);
      toast.error(e.response?.data?.message || 'Failed to update profile');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-44 rounded-2xl bg-muted/40" />
        <div className="h-12 rounded-xl bg-muted/40" />
        <div className="h-96 rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <Card className="p-8 text-center border-dashed">
        <p className="text-muted-foreground">Faculty profile records could not be retrieved.</p>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack} className="mt-4 gap-1">
            <ChevronLeft className="w-4 h-4" /> Go Back
          </Button>
        )}
      </Card>
    );
  }

  const avatarUrl = profileData.profilePictureUrl
    ? getAssetUrl(profileData.profilePictureUrl)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.fullName || profileData.firstName || 'Faculty')}&background=4F46E5&color=fff&size=128`;

  const tabs = [
    { key: 'personal', label: '1. Personal & Employment', icon: Briefcase, count: null },
    { key: 'qualifications', label: '2. Qualifications', icon: GraduationCap, count: null },
    { key: 'experience', label: '3. Experience & Retention', icon: History, count: profileData.retentionCategory ? `Cat ${profileData.retentionCategory}` : null },
    { key: 'promotions', label: '4. Promotion History', icon: TrendingUp, count: profileData.promotions?.length || 0 },
    { key: 'research', label: '5. Research & Publications', icon: BookOpen, count: (profileData.sciCount || 0) + (profileData.scopusCount || 0) },
    { key: 'resource', label: '6. Resource Person & Courses', icon: Users, count: profileData.resourcePersons?.length || 0 },
    { key: 'workload', label: '7. Teaching Workload', icon: Layers, count: `${profileData.totalTeachingLoadHours || 0} hrs` },
    { key: 'strength', label: '8. Class Strength', icon: Users2, count: null },
    { key: 'documents', label: '9. Documents & Photo', icon: FileCheck, count: null }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Top Action Bar: Directory Back Link, Individual Report Actions & HOD Combined Reports */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card/60 backdrop-blur-sm border border-border/80 p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          {onBack ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" /> Back to Faculty Directory
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground px-1">
              <Shield className="w-4 h-4 text-primary" />
              <span>ACADRO Faculty Dossier</span>
            </div>
          )}
          <Badge variant="outline" className="text-[11px] bg-muted/40 hidden sm:inline-flex">
            {isHod ? 'HOD Supervisory Access' : isCoordinator ? 'Class Coordinator View' : 'Faculty Access'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Individual Faculty Report Actions */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60">
            <span className="text-[10px] font-bold text-muted-foreground px-1.5 uppercase tracking-wider hidden sm:inline">
              Report Actions:
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateFacultyProfilePDF(profileData)}
              className="h-8 gap-1.5 text-xs bg-background shadow-xs hover:bg-muted font-medium"
              title="Download comprehensive PDF report covering all profile sections"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Download Full Report (PDF)</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPrintModalOpen(true)}
              className="h-8 gap-1.5 text-xs bg-background shadow-xs hover:bg-muted font-medium"
              title="Preview and print official faculty profile dossier"
            >
              <Printer className="w-3.5 h-3.5 text-foreground" />
              <span>Print Full Report</span>
            </Button>
          </div>

          {/* HOD-Only Combined Department Faculty Reports */}
          {isHod && (
            <div className="flex items-center gap-1.5 bg-primary/5 p-1 rounded-lg border border-primary/20">
              <span className="text-[10px] font-bold text-primary px-1.5 uppercase tracking-wider hidden md:inline">
                Department Faculty Reports:
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadDeptExcel}
                disabled={isDownloadingExcel}
                className="h-8 gap-1.5 text-xs bg-background hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 shadow-xs font-medium"
                title="Download combined department faculty roster in Excel (.xlsx) format"
              >
                {isDownloadingExcel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Download All Faculty Report (Excel)</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDeptPrintModalOpen(true)}
                className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs"
                title="Print departmental faculty roster with complete metrics"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All Faculty Report</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Header Profile Hero Card */}
      <Card className="border-border/60 shadow-sm overflow-hidden bg-gradient-to-br from-card via-card to-muted/20">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={profileData.fullName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-background shadow-lg"
              />
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Active
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {profileData.fullName || `${profileData.firstName} ${profileData.lastName}`}
                  </h1>
                  <p className="text-sm font-semibold text-primary mt-0.5 flex items-center justify-center md:justify-start gap-2">
                    <span>{profileData.designation || 'Faculty Member'}</span>
                    <span>•</span>
                    <span className="text-muted-foreground">{profileData.departmentName || 'Department'}</span>
                  </p>
                </div>
                
                {/* Retention Badge */}
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <Badge variant="outline" className="px-3 py-1 font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
                    Retention Category {profileData.retentionCategory || 'A'}
                  </Badge>
                  {profileData.hasPhd && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                      Ph.D.
                    </Badge>
                  )}
                </div>
              </div>

              {/* Meta Pills */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-primary" />
                  <span>Emp ID: <strong className="text-foreground">{profileData.employeeId}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  <span>{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    <span>{profileData.phone}</span>
                  </div>
                )}
                {profileData.joiningDate && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                    <span>Joined: {profileData.joiningDate}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-border/80 sticky top-0 z-20 bg-background/95 backdrop-blur-md pb-1">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'personal' && (
          <FacultyPersonalEmployment
            data={profileData}
            isHod={isHod}
            isCoordinator={isCoordinator}
            readOnly={!isViewingSelf && !isHod}
            departments={departmentsList}
            designations={['Professor', 'Associate Professor', 'Assistant Professor', 'Senior Professor', 'HOD', 'Adjunct Faculty', 'Lecturer']}
            onSave={handleSaveProfile}
          />
        )}

        {activeTab === 'qualifications' && (
          <FacultyQualifications
            data={profileData}
            readOnly={!isViewingSelf && !isHod}
            onSave={handleSaveProfile}
          />
        )}

        {activeTab === 'experience' && (
          <FacultyExperienceRetention
            data={profileData}
            isHod={isHod}
            readOnly={!isViewingSelf && !isHod}
            onSave={handleSaveProfile}
          />
        )}

        {activeTab === 'promotions' && (
          <FacultyPromotionHistory
            facultyId={targetFacultyId}
            facultyName={profileData.fullName}
            employeeId={profileData.employeeId}
            currentDesignation={profileData.designation || 'Faculty Member'}
            role={profileData.role}
            promotions={profileData.promotions || []}
            isHod={isHod}
            onRefresh={fetchProfile}
          />
        )}

        {activeTab === 'research' && (
          <FacultyResearchPublications
            facultyId={targetFacultyId}
            data={profileData}
            researchItems={profileData.researchContributions || []}
            readOnly={!isViewingSelf && !isHod}
            onSaveProfile={handleSaveProfile}
            onRefresh={fetchProfile}
          />
        )}

        {activeTab === 'resource' && (
          <FacultyResourcePerson
            facultyId={targetFacultyId}
            resourcePersons={profileData.resourcePersons || []}
            academicYears={academicYearsList}
            readOnly={!isViewingSelf && !isHod}
            onRefresh={fetchProfile}
          />
        )}

        {activeTab === 'workload' && (
          <FacultyWorkload
            data={profileData}
            assignedSubjects={profileData.assignedSubjects || []}
            readOnly={!isViewingSelf && !isHod}
            onSave={handleSaveProfile}
          />
        )}

        {activeTab === 'strength' && (
          <FacultyClassStrength
            departmentId={profileData.departmentId}
            isHod={isHod}
            readOnly={!isHod}
          />
        )}

        {activeTab === 'documents' && (
          <FacultyDocumentsPhoto
            data={profileData}
            photoUrl={profileData.profilePictureUrl}
            readOnly={!isViewingSelf && !isHod}
            onSaveProfile={handleSaveProfile}
          />
        )}
      </div>
 
      {/* Individual Faculty Profile Print Modal */}
      {profileData && (
        <FacultyProfilePrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          profile={profileData}
        />
      )}

      {/* HOD-Only Department Faculty Print Modal */}
      {isHod && (
        <DepartmentFacultyPrintModal
          isOpen={isDeptPrintModalOpen}
          onClose={() => setIsDeptPrintModalOpen(false)}
          departmentName={profileData?.departmentName}
        />
      )}

    </div>
  );
};
