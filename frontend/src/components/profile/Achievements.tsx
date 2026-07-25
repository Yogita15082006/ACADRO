import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Trophy, Plus, Trash2, Calendar, Link as LinkIcon, Edit, Save } from 'lucide-react';

interface AchievementsProps {
  data: any;
  readOnly: boolean;
  onUpdate: (data: any) => void;
}

export const Achievements: React.FC<AchievementsProps> = ({ data, readOnly, onUpdate }) => {
  const [achievements, setAchievements] = useState<any[]>(data.achievements || []);
  const [isEditing, setIsEditing] = useState(false);
  
  // Temp state for new item
  const [newItem, setNewItem] = useState({
    title: '',
    category: '', // e.g. Sports, Hackathon, Cultural
    date: '',
    description: '',
    link: ''
  });

  const handleAdd = () => {
    if (newItem.title && newItem.category) {
      const updated = [...achievements, { ...newItem, id: Date.now() }];
      setAchievements(updated);
      onUpdate(updated);
      setNewItem({ title: '', category: '', date: '', description: '', link: '' });
    }
  };

  const handleDelete = (id: number) => {
    const updated = achievements.filter(a => a.id !== id);
    setAchievements(updated);
    onUpdate(updated);
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" /> Extra-Curricular & Achievements
          </CardTitle>
          <CardDescription>Highlight your participations, awards, and overall non-academic growth.</CardDescription>
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
            <h4 className="text-sm font-bold text-foreground">Add New Achievement</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Title / Award</label>
                <Input value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="e.g. First Prize - Coding Competition" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <Input value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} placeholder="e.g. Hackathon, Sports, Cultural" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Date / Year</label>
                <Input type="text" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} placeholder="e.g. Oct 2023" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Link (Optional)</label>
                <Input value={newItem.link} onChange={e => setNewItem({...newItem, link: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <Textarea 
                  value={newItem.description} 
                  onChange={e => setNewItem({...newItem, description: e.target.value})} 
                  placeholder="Briefly describe your role or what you achieved..."
                  className="resize-none h-20"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} className="gap-2"><Plus className="w-4 h-4" /> Add</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.length === 0 ? (
            <div className="col-span-full py-8 text-center text-muted-foreground italic bg-muted/5 rounded-xl border border-dashed border-border/50">
              No achievements added yet.
            </div>
          ) : (
            achievements.map(achievement => (
              <div key={achievement.id} className="relative p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col group min-w-0">
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h5 className="font-bold text-foreground text-base pr-8 truncate">{achievement.title}</h5>
                  {isEditing && (
                    <button 
                      onClick={() => handleDelete(achievement.id)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase truncate max-w-[50%] shrink-0">
                    {achievement.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                    <Calendar className="w-3 h-3 shrink-0" /> <span className="truncate">{achievement.date}</span>
                  </span>
                </div>
                
                {achievement.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
                    {achievement.description}
                  </p>
                )}

                {achievement.link && (
                  <div className="mt-auto pt-3 border-t border-border/40">
                    <a href={achievement.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:underline w-fit">
                      <LinkIcon className="w-3 h-3" /> View Details
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
