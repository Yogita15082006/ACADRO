import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Edit, Save, Briefcase, Globe, X, Plus, Upload, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';

const Github = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const CodeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
);

interface ProfessionalDetailsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => void;
}

export const ProfessionalDetails: React.FC<ProfessionalDetailsProps> = ({ data, readOnly, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    skills: data?.skills || [],
    linkedin: data?.linkedin || '',
    github: data?.github || '',
    portfolio: data?.portfolio || '',
    leetcode: data?.leetcode || '',
    hackerrank: data?.hackerrank || '',
    domains: data?.domains || [],
    jobPreferences: data?.jobPreferences || '',
    relocation: data?.relocation || '',
    resumeFileName: data?.resumeFileName || '',
    resumeUploadedAt: data?.resumeUploadedAt || '',
  });

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s: string) => s !== skill) });
  };

  const handleAddDomain = () => {
    if (newDomain.trim() && !formData.domains.includes(newDomain.trim())) {
      setFormData({ ...formData, domains: [...formData.domains, newDomain.trim()] });
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setFormData({ ...formData, domains: formData.domains.filter((d: string) => d !== domain) });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData({ 
        ...formData, 
        resumeFileName: file.name,
        resumeUploadedAt: new Date().toLocaleDateString()
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Section F: Professional Details
          </CardTitle>
          <CardDescription>Career preferences, domains, skills, and resume management.</CardDescription>
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
          <div className="space-y-8">
            {/* Career Preferences */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Career Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Preferences (e.g., SDE, Frontend, Data Science)</Label>
                  <Input 
                    placeholder="Enter your job preferences" 
                    value={formData.jobPreferences} 
                    onChange={(e) => setFormData({ ...formData, jobPreferences: e.target.value })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Open to Relocation</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.relocation}
                    onChange={(e) => setFormData({ ...formData, relocation: e.target.value })}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Depends on opportunity">Depends on opportunity</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border/40">
              {/* Domains of Interest */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Domains of Interest</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add domain (e.g. Web Dev, AI)" 
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                  />
                  <Button type="button" onClick={handleAddDomain}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.domains.map((domain: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-background px-3 py-1.5 text-sm font-medium border-border/60 flex items-center gap-2">
                      {domain}
                      <button type="button" onClick={() => handleRemoveDomain(domain)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Technical Skills</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add a skill (e.g. React, Python)" 
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <Button type="button" onClick={handleAddSkill}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-background px-3 py-1.5 text-sm font-medium border-border/60 flex items-center gap-2">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="text-muted-foreground hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Resume Management</h4>
              <div className="border-2 border-dashed border-border/60 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                
                {formData.resumeFileName ? (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{formData.resumeFileName}</p>
                      <p className="text-sm text-muted-foreground">Uploaded on {formData.resumeUploadedAt}</p>
                    </div>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" size="sm" onClick={triggerFileUpload}>
                        <Upload className="w-4 h-4 mr-2" /> Replace Resume
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <X className="w-4 h-4 mr-2" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Upload your latest resume</p>
                      <p className="text-sm text-muted-foreground mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
                    </div>
                    <Button type="button" onClick={triggerFileUpload}>
                      Browse Files
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Social & Portfolio Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Linkedin className="w-3 h-3"/> LinkedIn</label>
                  <Input placeholder="https://linkedin.com/in/..." value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Github className="w-3 h-3"/> GitHub</label>
                  <Input placeholder="https://github.com/..." value={formData.github} onChange={(e) => setFormData({ ...formData, github: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><CodeIcon className="w-3 h-3"/> LeetCode</label>
                  <Input placeholder="https://leetcode.com/..." value={formData.leetcode} onChange={(e) => setFormData({ ...formData, leetcode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><CodeIcon className="w-3 h-3"/> HackerRank</label>
                  <Input placeholder="https://hackerrank.com/..." value={formData.hackerrank} onChange={(e) => setFormData({ ...formData, hackerrank: e.target.value })} />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><Globe className="w-3 h-3"/> Portfolio/Website</label>
                  <Input placeholder="https://..." value={formData.portfolio} onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* Career Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 p-5 rounded-xl border border-border/50">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase truncate">Job Preferences</p>
                <p className="font-medium text-foreground truncate" title={formData.jobPreferences}>{formData.jobPreferences || 'Not specified'}</p>
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase truncate">Open to Relocation</p>
                <p className="font-medium text-foreground truncate" title={formData.relocation}>{formData.relocation}</p>
              </div>
            </div>

            {/* Domains & Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Domains of Interest</h4>
                {formData.domains && formData.domains.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.domains.map((domain: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 bg-secondary text-secondary-foreground border-border/50">
                        {domain}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No domains added yet.</p>
                )}
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Technical Skills</h4>
                {formData.skills && formData.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-primary/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* Resume Preview */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Resume</h4>
              {formData.resumeFileName ? (
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{formData.resumeFileName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Uploaded {formData.resumeUploadedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="w-4 h-4" /> Preview
                    </Button>
                    <Button variant="default" size="sm" className="gap-2">
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/20 border border-dashed border-border/50 rounded-xl flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg text-muted-foreground">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">No resume uploaded</p>
                    <p className="text-xs text-muted-foreground">Please upload your latest resume in edit mode.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.linkedin ? (
                  <a href={formData.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="text-blue-600"><Linkedin className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-foreground truncate">LinkedIn Profile</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 opacity-50">
                    <div className="text-muted-foreground"><Linkedin className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-muted-foreground">LinkedIn (Not provided)</span>
                  </div>
                )}
                
                {formData.github ? (
                  <a href={formData.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="text-foreground"><Github className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-foreground truncate">GitHub Profile</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 opacity-50">
                    <div className="text-muted-foreground"><Github className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-muted-foreground">GitHub (Not provided)</span>
                  </div>
                )}
                
                {formData.leetcode ? (
                  <a href={formData.leetcode} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="text-orange-500"><CodeIcon className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-foreground truncate">LeetCode Profile</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 opacity-50">
                    <div className="text-muted-foreground"><CodeIcon className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-muted-foreground">LeetCode (Not provided)</span>
                  </div>
                )}

                {formData.hackerrank ? (
                  <a href={formData.hackerrank} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="text-green-500"><CodeIcon className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-foreground truncate">HackerRank Profile</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 opacity-50">
                    <div className="text-muted-foreground"><CodeIcon className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-muted-foreground">HackerRank (Not provided)</span>
                  </div>
                )}
                
                {formData.portfolio ? (
                  <a href={formData.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors lg:col-span-2">
                    <div className="text-indigo-500"><Globe className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-foreground truncate">Portfolio Website</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border/50 opacity-50 lg:col-span-2">
                    <div className="text-muted-foreground"><Globe className="w-5 h-5" /></div>
                    <span className="text-sm font-medium text-muted-foreground">Portfolio (Not provided)</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
};
