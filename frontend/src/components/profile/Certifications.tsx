import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Award, Plus, Trash2, Calendar, Link as LinkIcon, Edit, Save } from 'lucide-react';

interface CertificationsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => any;
}

export const Certifications: React.FC<CertificationsProps> = ({ data, readOnly, onUpdate }) => {
  const [certifications, setCertifications] = useState<any[]>(data?.certifications || []);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (data?.certifications) {
      setCertifications(data.certifications);
    }
  }, [data]);
  
  // Temp state for new item
  const [newItem, setNewItem] = useState({
    title: '',
    issuer: '',
    date: '',
    link: ''
  });

  const handleAdd = () => {
    if (newItem.title && newItem.issuer) {
      const updated = [...certifications, { ...newItem, id: crypto.randomUUID() }];
      setCertifications(updated);
      onUpdate({ certifications: updated });
      setNewItem({ title: '', issuer: '', date: '', link: '' });
    }
  };

  const handleDelete = (id: number) => {
    const updated = certifications.filter(c => c.id !== id);
    setCertifications(updated);
    onUpdate({ certifications: updated });
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Certifications
          </CardTitle>
          <CardDescription>Track your professional certifications and courses.</CardDescription>
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
          <div className="bg-muted/10 p-4 rounded-xl border border-border/50 space-y-4">
            <h4 className="text-sm font-bold text-foreground">Add New Certification</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Certification Title</label>
                <Input value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. AWS Solutions Architect" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Issuer / Organization</label>
                <Input value={newItem.issuer} onChange={e => setNewItem({...newItem, issuer: e.target.value})} placeholder="e.g. Amazon Web Services" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Issue Date</label>
                <Input type="month" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Credential URL (Optional)</label>
                <Input value={newItem.link} onChange={e => setNewItem({...newItem, link: e.target.value})} placeholder="https://..." />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed border-border/50">
              No certifications added yet.
            </div>
          ) : (
            certifications.map(cert => (
              <div key={cert.id} className="relative p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between group min-w-0">
                <div className="space-y-3 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => handleDelete(cert.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete certification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-bold text-foreground text-base leading-tight pr-6 truncate">{cert.title}</h5>
                    <p className="text-sm font-medium text-muted-foreground mt-1 truncate">{cert.issuer}</p>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-border/50 flex flex-col gap-2 text-xs text-muted-foreground min-w-0">
                  <span className="flex items-center gap-1.5 font-medium min-w-0"><Calendar className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Issued: {cert.date || 'N/A'}</span></span>
                  {cert.link && (
                    <a href={cert.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
                      <LinkIcon className="w-3.5 h-3.5" /> View Credential
                    </a>
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

