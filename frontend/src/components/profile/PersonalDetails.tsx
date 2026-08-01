import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Edit, Save, User, Calendar, Droplets, Map, Hash, Home, Phone, GraduationCap, FileText, Camera } from 'lucide-react';
import { Textarea } from '../ui/textarea';

interface PersonalDetailsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => void;
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({ data, readOnly, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(data.photo || `https://ui-avatars.com/api/?name=${data.name || 'Student'}&background=4F46E5&color=fff&size=128`);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    // Basic Info
    name: data.name || (data.firstName ? `${data.firstName} ${data.lastName}`.trim() : '') || '',
    gender: data.gender ? (data.gender.charAt(0).toUpperCase() + data.gender.slice(1).toLowerCase()) : '',
    dob: data.dob || '',
    category: data.category || '',
    bloodGroup: data.bloodGroup ? data.bloodGroup.replace('_PLUS', '+').replace('_MINUS', '-') : '',
    nationality: data.nationality || '',
    religion: data.religion || '',
    aadhaarNumber: data.aadhaarNumber || '',
    residenceType: data.residenceType || '',
    
    // Contact Info
    mobileNumber: data.phone || data.mobileNumber || '',
    whatsappNumber: data.whatsappNumber || '',
    personalEmail: data.personalEmail || '',
    collegeEmail: data.collegeEmail || data.email || '',

    // Academic Info
    rgpvEnrollment: data.enrollmentNumber || data.enrollmentNo || data.rgpvEnrollment || '',
    instituteEnrollment: data.instituteEnrollment || data.admissionYear || data.rollNo || data.rollNumber || '',
    course: data.course || '',
    branch: data.department || data.departmentName || data.branch || '',
    batchYear: data.batchYear || data.batch || '',
    currentSemester: data.currentSemester || data.semester || '',
    section: data.section || (data.className !== 'Unassigned' ? data.className : '') || '',

    // Skills & Interests
    clubs: data.clubs || '',
    hobbies: data.hobbies || '',
    skills: data.skills ? (Array.isArray(data.skills) ? data.skills.join(', ') : data.skills) : ''
  });

  const handleSave = () => {
    const nameParts = formData.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const mapBloodGroup = (bg: string) => {
      switch(bg) {
        case "A+": return "A_PLUS";
        case "A-": return "A_MINUS";
        case "B+": return "B_PLUS";
        case "B-": return "B_MINUS";
        case "AB+": return "AB_PLUS";
        case "AB-": return "AB_MINUS";
        case "O+": return "O_PLUS";
        case "O-": return "O_MINUS";
        default: return null;
      }
    };

    const updatedData = {
      ...formData,
      firstName,
      lastName,
      phone: formData.mobileNumber,
      departmentName: formData.branch,
      enrollmentNo: formData.rgpvEnrollment,
      bloodGroup: mapBloodGroup(formData.bloodGroup),
      gender: formData.gender.toUpperCase(),
      profilePictureUrl: photoPreview,
      skills: formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '')
    };
    onUpdate(updatedData);
    setIsEditing(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoPreview(url);
    }
  };

  const renderSectionHeader = (title: string, icon: React.ReactNode) => (
    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-4 mt-8 first:mt-0">
      {icon} {title}
    </h4>
  );

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="w-5 h-5 text-primary" /> SECTION A : PERSONAL DETAILS
          </CardTitle>
          <CardDescription>Comprehensive student profile and academic identity.</CardDescription>
        </div>
        {!readOnly && (
          <Button 
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? (
              <><Save className="w-4 h-4" /> Save</>
            ) : (
              <><Edit className="w-4 h-4" /> Edit</>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-8 animate-in fade-in">
            {/* Basic Information */}
            <div>
              {renderSectionHeader('Basic Information', <User className="w-4 h-4 text-primary" />)}
              
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="relative group/photo cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img 
                      src={photoPreview} 
                      alt="Passport" 
                      className="w-32 h-40 object-cover rounded-md border-2 border-border shadow-sm group-hover/photo:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity bg-black/40 rounded-md">
                      <Camera className="text-white w-8 h-8" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  <span className="text-xs font-medium text-muted-foreground">Passport Photo</span>
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Gender</label>
                    <select 
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
                    <Input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Blood Group</label>
                    <select 
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Nationality</label>
                    <Input value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Religion</label>
                    <Input value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Aadhaar Number</label>
                    <Input value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Residence Type</label>
                    <select 
                      value={formData.residenceType}
                      onChange={(e) => setFormData({ ...formData, residenceType: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Local">Local</option>
                      <option value="Hosteler">Hosteler</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              {renderSectionHeader('Contact Information', <Phone className="w-4 h-4 text-primary" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Mobile Number</label>
                  <Input value={formData.mobileNumber} onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number</label>
                  <Input value={formData.whatsappNumber} onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Personal Email</label>
                  <Input type="email" value={formData.personalEmail} onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">College Email</label>
                  <Input type="email" value={formData.collegeEmail} onChange={(e) => setFormData({ ...formData, collegeEmail: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              {renderSectionHeader('Academic Information', <GraduationCap className="w-4 h-4 text-primary" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">RGPV Enrollment No.</label>
                  <Input value={formData.rgpvEnrollment} onChange={(e) => setFormData({ ...formData, rgpvEnrollment: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Institute Enrollment No.</label>
                  <Input value={formData.instituteEnrollment} onChange={(e) => setFormData({ ...formData, instituteEnrollment: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Course</label>
                  <Input value={formData.course} onChange={(e) => setFormData({ ...formData, course: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Branch</label>
                  <Input value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Batch Year</label>
                  <Input value={formData.batchYear} placeholder="e.g. 2022-2026" onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Current Semester</label>
                  <select 
                    value={formData.currentSemester}
                    onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select Sem</option>
                    {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Section</label>
                  <Input value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Skills & Interests */}
            <div>
              {renderSectionHeader('Skills & Interests', <FileText className="w-4 h-4 text-primary" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Skills (comma separated)</label>
                  <Textarea value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Clubs / Communities</label>
                  <Input value={formData.clubs} onChange={(e) => setFormData({ ...formData, clubs: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Hobbies</label>
                  <Input value={formData.hobbies} onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })} />
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            {/* Basic Information */}
            <div>
              {renderSectionHeader('Basic Information', <User className="w-4 h-4 text-primary" />)}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <img 
                    src={photoPreview} 
                    alt="Passport" 
                    className="w-32 h-40 object-cover rounded-md border border-border shadow-sm"
                  />
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Full Name</span>
                    <span className="font-medium text-foreground truncate" title={formData.name || 'N/A'}>{formData.name || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Gender</span>
                    <span className="font-medium text-foreground truncate" title={formData.gender || 'N/A'}>{formData.gender || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Date of Birth</span>
                    <span className="font-medium text-foreground flex items-center gap-2 min-w-0" title={formData.dob || 'N/A'}><Calendar className="w-3 h-3 text-primary flex-shrink-0"/><span className="truncate">{formData.dob || 'N/A'}</span></span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Category</span>
                    <span className="font-medium text-foreground min-w-0" title={formData.category || 'N/A'}><Badge variant="outline" className="truncate max-w-full block text-left">{formData.category || 'N/A'}</Badge></span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Blood Group</span>
                    <span className="font-medium text-foreground flex items-center gap-2 min-w-0" title={formData.bloodGroup || 'N/A'}><Droplets className="w-3 h-3 text-red-500 flex-shrink-0"/><span className="truncate">{formData.bloodGroup || 'N/A'}</span></span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Nationality</span>
                    <span className="font-medium text-foreground flex items-center gap-2 min-w-0" title={formData.nationality || 'N/A'}><Map className="w-3 h-3 text-primary flex-shrink-0"/><span className="truncate">{formData.nationality || 'N/A'}</span></span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Aadhaar Number</span>
                    <span className="font-medium text-foreground flex items-center gap-2 min-w-0" title={formData.aadhaarNumber || 'N/A'}><Hash className="w-3 h-3 text-primary flex-shrink-0"/><span className="truncate">{formData.aadhaarNumber || 'N/A'}</span></span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Religion</span>
                    <span className="font-medium text-foreground truncate" title={formData.religion || 'N/A'}>{formData.religion || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col space-y-1 min-w-0">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Residence Type</span>
                    <span className="font-medium text-foreground flex items-center gap-2 min-w-0" title={formData.residenceType || 'N/A'}><Home className="w-3 h-3 text-primary flex-shrink-0"/><span className="truncate">{formData.residenceType || 'N/A'}</span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              {renderSectionHeader('Contact Information', <Phone className="w-4 h-4 text-primary" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Mobile Number</span>
                  <span className="font-medium text-foreground truncate" title={formData.mobileNumber || 'N/A'}>{formData.mobileNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">WhatsApp Number</span>
                  <span className="font-medium text-foreground truncate" title={formData.whatsappNumber || 'N/A'}>{formData.whatsappNumber || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Personal Email</span>
                  <span className="font-medium text-foreground truncate" title={formData.personalEmail || 'N/A'}>{formData.personalEmail || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">College Email</span>
                  <span className="font-medium text-foreground truncate" title={formData.collegeEmail || 'N/A'}>{formData.collegeEmail || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              {renderSectionHeader('Academic Information', <GraduationCap className="w-4 h-4 text-primary" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">RGPV Enrollment No.</span>
                  <span className="font-medium text-foreground truncate" title={formData.rgpvEnrollment || 'N/A'}>{formData.rgpvEnrollment || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Institute Enroll. No.</span>
                  <span className="font-medium text-foreground truncate" title={formData.instituteEnrollment || 'N/A'}>{formData.instituteEnrollment || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Course</span>
                  <span className="font-medium text-foreground truncate" title={formData.course || 'N/A'}>{formData.course || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Branch</span>
                  <span className="font-medium text-foreground truncate" title={formData.branch || 'N/A'}>{formData.branch || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Batch Year</span>
                  <span className="font-medium text-foreground truncate" title={formData.batchYear || 'N/A'}>{formData.batchYear || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Current Semester</span>
                  <span className="font-medium text-foreground truncate" title={formData.currentSemester || 'N/A'}>{formData.currentSemester || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Section</span>
                  <span className="font-medium text-foreground truncate" title={formData.section || 'N/A'}>{formData.section || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Skills & Interests */}
            <div>
              {renderSectionHeader('Skills & Interests', <FileText className="w-4 h-4 text-primary" />)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
                <div className="flex flex-col space-y-2 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills ? formData.skills.split(',').map((s: string, i: number) => {
                      const trimmed = s.trim();
                      if (!trimmed) return null;
                      return <Badge key={i} variant="secondary">{trimmed}</Badge>;
                    }) : <span className="text-sm">N/A</span>}
                  </div>
                </div>
                <div className="flex flex-col space-y-1 mt-2 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clubs / Communities</span>
                  <span className="font-medium text-foreground break-words">{formData.clubs || 'N/A'}</span>
                </div>
                <div className="flex flex-col space-y-1 mt-2 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hobbies</span>
                  <span className="font-medium text-foreground break-words">{formData.hobbies || 'N/A'}</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
};
