import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { BriefcaseBusiness, Plus, Trash2, Calendar, Link as LinkIcon, Edit, Save, Building2, UserCircle, Code2, AlignLeft } from 'lucide-react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface InternshipsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => any;
}

export const Internships: React.FC<InternshipsProps> = ({ data, readOnly, onUpdate }) => {
  const [internships, setInternships] = useState<any[]>(data?.internships || []);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (data?.internships) {
      setInternships(data.internships);
    }
  }, [data]);
  
  const [newItem, setNewItem] = useState({
    role: '',
    company: '',
    mentor: '',
    duration: '',
    technologies: '',
    description: '',
    link: ''
  });

  const handleAdd = () => {
    if (newItem.role && newItem.company) {
      const updated = [...internships, { 
        ...newItem, 
        id: crypto.randomUUID(),
        technologies: newItem.technologies.split(',').map(t => t.trim()).filter(t => t)
      }];
      setInternships(updated);
      onUpdate({ internships: updated });
      setNewItem({ role: '', company: '', mentor: '', duration: '', technologies: '', description: '', link: '' });
    }
  };

  const handleDelete = (id: number) => {
    const updated = internships.filter(i => i.id !== id);
    setInternships(updated);
    onUpdate({ internships: updated });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <BriefcaseBusiness className="w-5 h-5 text-primary" /> Internship Experience
          </CardTitle>
          <CardDescription>Industry experience and internships.</CardDescription>
        </div>
        {!readOnly && (
          <Button 
            variant={isEditing ? 'default' : 'outline'}
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            {isEditing ? (
              <><Save className="w-4 h-4" /> Done</>
            ) : (
              <><Edit className="w-4 h-4" /> Manage</>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {isEditing && !readOnly && (
          <div className="bg-muted/10 p-5 rounded-xl border border-border/50 space-y-5">
            <h4 className="text-sm font-bold text-foreground">Add New Internship</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Role / Title</Label>
                <Input value={newItem.role} onChange={e => setNewItem({...newItem, role: e.target.value})} placeholder="e.g. Frontend Developer Intern" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={newItem.company} onChange={e => setNewItem({...newItem, company: e.target.value})} placeholder="e.g. Google" />
              </div>
              <div className="space-y-2">
                <Label>Mentor Name (Optional)</Label>
                <Input value={newItem.mentor} onChange={e => setNewItem({...newItem, mentor: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input value={newItem.duration} onChange={e => setNewItem({...newItem, duration: e.target.value})} placeholder="e.g. May 2024 - Aug 2024" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Technologies Used (Comma separated)</Label>
                <Input value={newItem.technologies} onChange={e => setNewItem({...newItem, technologies: e.target.value})} placeholder="React, Node.js, TypeScript" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Describe your responsibilities and achievements..." className="min-h-[100px]" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Certificate / Offer Letter URL (Optional)</Label>
                <Input value={newItem.link} onChange={e => setNewItem({...newItem, link: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Experience</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {internships.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed border-border/50">
              No internship experience added yet.
            </div>
          ) : (
            internships.map(internship => (
              <div key={internship.id} className="relative p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all group">
                {isEditing && (
                  <button 
                    onClick={() => handleDelete(internship.id)}
                    className="absolute top-5 right-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete internship"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1 min-w-0 space-y-4">
                    <div>
                      <h5 className="font-bold text-lg text-foreground leading-tight pr-6 truncate">{internship.role}</h5>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium text-primary min-w-0">
                          <Building2 className="w-4 h-4 shrink-0" /> <span className="truncate">{internship.company}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" /> {internship.duration || 'Duration not specified'}
                        </span>
                        {internship.mentor && (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <UserCircle className="w-4 h-4 shrink-0" /> <span className="truncate">Mentor: {internship.mentor}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {internship.description && (
                      <div className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50 flex gap-2">
                        <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p>{internship.description}</p>
                      </div>
                    )}

                    {internship.technologies && internship.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <Code2 className="w-4 h-4 text-muted-foreground mr-1" />
                        {internship.technologies.map((tech: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="px-2.5 py-0.5 bg-secondary text-secondary-foreground text-xs border-border/50">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {internship.link && (
                      <div className="pt-2">
                        <a href={internship.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
                          <LinkIcon className="w-4 h-4" /> View Certificate
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
