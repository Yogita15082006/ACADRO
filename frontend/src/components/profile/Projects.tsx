import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { FolderGit2, Plus, Trash2, Globe, Edit, Save, Code2, AlignLeft } from 'lucide-react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

interface ProjectsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => any;
}

export const Projects: React.FC<ProjectsProps> = ({ data, readOnly, onUpdate }) => {
  const [projects, setProjects] = useState<any[]>(data?.projects || []);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (data?.projects) {
      setProjects(data.projects);
    }
  }, [data]);
  
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    techStack: '',
    githubLink: '',
    liveLink: ''
  });

  const handleAdd = () => {
    if (newItem.title) {
      const updated = [...projects, { 
        ...newItem, 
        id: crypto.randomUUID(),
        techStack: newItem.techStack.split(',').map(t => t.trim()).filter(t => t)
      }];
      setProjects(updated);
      onUpdate({ projects: updated });
      setNewItem({ title: '', description: '', techStack: '', githubLink: '', liveLink: '' });
    }
  };

  const handleDelete = (id: number) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    onUpdate({ projects: updated });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-primary" /> Projects
          </CardTitle>
          <CardDescription>Showcase your best academic and personal projects.</CardDescription>
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
            <h4 className="text-sm font-bold text-foreground">Add New Project</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <Label>Project Title</Label>
                <Input value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. E-Commerce Platform" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Tech Stack (Comma separated)</Label>
                <Input value={newItem.techStack} onChange={e => setNewItem({...newItem, techStack: e.target.value})} placeholder="React, Node.js, MongoDB" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="What does this project do? What were the challenges?" className="min-h-[100px]" />
              </div>
              <div className="space-y-2">
                <Label>GitHub Repository URL</Label>
                <Input value={newItem.githubLink} onChange={e => setNewItem({...newItem, githubLink: e.target.value})} placeholder="https://github.com/..." />
              </div>
              <div className="space-y-2">
                <Label>Live Project URL (Optional)</Label>
                <Input value={newItem.liveLink} onChange={e => setNewItem({...newItem, liveLink: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Project</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed border-border/50">
              No projects added yet.
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="relative p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all group flex flex-col h-full">
                {isEditing && (
                  <button 
                    onClick={() => handleDelete(project.id)}
                    className="absolute top-5 right-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="flex-1 min-w-0 space-y-4">
                  <h5 className="font-bold text-lg text-foreground leading-tight pr-6 truncate">{project.title}</h5>
                  
                  {project.description && (
                    <div className="text-sm text-foreground/80 leading-relaxed bg-muted/10 p-3 rounded-lg flex gap-2">
                      <AlignLeft className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p>{project.description}</p>
                    </div>
                  )}

                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <Code2 className="w-4 h-4 text-muted-foreground mr-1" />
                      {project.techStack.map((tech: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs border-primary/20">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-4">
                  {project.githubLink && (
                    <a href={project.githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-foreground hover:underline font-medium">
                      <GithubIcon className="w-4 h-4" /> Source Code
                    </a>
                  )}
                  {project.liveLink && (
                    <a href={project.liveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
                      <Globe className="w-4 h-4" /> Live Demo
                    </a>
                  )}
                  {!project.githubLink && !project.liveLink && (
                    <span className="text-sm text-muted-foreground italic">No links provided</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
