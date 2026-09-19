import { useState, useMemo } from 'react';
import { CustomSelect } from "@/components/ui/select";

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Edit, Trash2, GraduationCap, User, Briefcase, Users, X, Search } from 'lucide-react';
import { mockData } from '../data/mockData';
import { Input } from '@/components/ui/input';
import { useAuth } from '../context/AuthContext';

export const CoordinatorsModule = () => {
  const { startImpersonation } = useAuth();
  const navigate = useNavigate();
  const [coordinators, setCoordinators] = useState<any[]>(mockData.admins.filter(a => a.role === 'coordinator'));
  const [isAdding, setIsAdding] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: '',
    classes: [] as { year: string, name: string }[]
  });

  const formatYear = (year: string) => {
    if (year === 'First Year') return '1st Year';
    if (year === 'Second Year') return '2nd Year';
    if (year === 'Third Year') return '3rd Year';
    if (year === 'Fourth Year') return '4th Year';
    return year;
  };

  const availableYears = Array.from(new Set(mockData.classes.map(c => c.year)));

  const handleSaveCoordinator = () => {
    if (!formData.name || !formData.email || !formData.empId) {
      alert("Please fill in all basic details.");
      return;
    }
    
    if (formData.classes.length === 0) {
      alert("At least one class assignment is required.");
      return;
    }

    const seen = new Set<string>();
    const classIds: string[] = [];
    
    for (const a of formData.classes) {
      if (!a.year || !a.name) {
        alert("Please complete all assignment fields.");
        return;
      }
      const key = `${a.year}-${a.name}`;
      if (seen.has(key)) {
        alert(`Duplicate assignment found: ${formatYear(a.year)} → ${a.name}`);
        return;
      }
      seen.add(key);
      
      const cls = mockData.classes.find(c => c.year === a.year && c.name === a.name);
      if (cls) classIds.push(cls.id);
    }

    if (editingId) {
      setCoordinators(coordinators.map(c => c.id === editingId ? {
        ...c,
        name: formData.name,
        email: formData.email,
        empId: formData.empId,
        classes: classIds
      } : c));
    } else {
      const newCoordinator = {
        id: `C${Date.now()}`,
        name: formData.name,
        email: formData.email,
        empId: formData.empId,
        subjects: [],
        classes: classIds,
        role: 'coordinator',
        createdAt: new Date().toISOString()
      };
      setCoordinators([newCoordinator, ...coordinators]);
    }
    
    closeForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this coordinator?')) {
      setCoordinators(coordinators.filter(c => c.id !== id));
    }
  };

  const handleEdit = (coordinator: any) => {
    setEditingId(coordinator.id);
    setFormData({
      name: coordinator.name,
      email: coordinator.email,
      empId: coordinator.empId,
      classes: coordinator.classes.map((clsId: string) => {
        const cls = mockData.classes.find(c => c.id === clsId);
        return { year: cls?.year || '', name: cls?.name || '' };
      }).filter((a: any) => a.year && a.name)
    });
    setIsAdding(true);
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', email: '', empId: '', classes: [] });
  };

  const addAssignment = () => {
    setFormData(prev => ({ ...prev, classes: [...prev.classes, { year: '', name: '' }] }));
  };

  const updateAssignment = (index: number, field: 'year' | 'name', value: string) => {
    const newClasses = [...formData.classes];
    newClasses[index] = { ...newClasses[index], [field]: value };
    if (field === 'year') newClasses[index].name = ''; // Reset class when year changes
    setFormData(prev => ({ ...prev, classes: newClasses }));
  };

  const removeAssignment = (index: number) => {
    setFormData(prev => ({ ...prev, classes: prev.classes.filter((_, i) => i !== index) }));
  };

  const filteredAndSortedCoordinators = useMemo(() => {
    let result = [...coordinators];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.email.toLowerCase().includes(q) || 
        c.empId.toLowerCase().includes(q)
      );
    }

    // Filter functionality could go here if needed
    // Removed subject filtering as coordinators are no longer assigned subjects

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name);
      } else if (sortBy === 'recent') {
        // Fallback for mock data without createdAt
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

    return result;
  }, [coordinators, searchQuery, sortBy]);



  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border/50 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users size={24} className="text-primary" />
            Class Coordinators
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Create, manage, and monitor all Class Coordinators.</p>
        </div>
        <Button onClick={() => {
          if (isAdding) closeForm();
          else setIsAdding(true);
        }} className="shrink-0 shadow-md">
          {isAdding ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
          {isAdding ? 'Cancel' : 'Create Class Coordinator'}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg bg-card animate-in slide-in-from-top-4 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50"></div>
          <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User size={18} className="text-primary" /> {editingId ? 'Edit Coordinator' : 'Create New Coordinator'}
            </CardTitle>
            <CardDescription>Enter details to add a new coordinator to the system.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. Prof. Arvind Sharma" 
                    className="pl-9"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="e.g. arvind.sharma@acropolis.in" 
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee ID</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="e.g. EMP204" 
                    className="pl-9"
                    value={formData.empId}
                    onChange={(e) => setFormData({...formData, empId: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4 pt-2">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Assignments</label>
                  <Button type="button" variant="outline" size="sm" onClick={addAssignment} className="h-8 text-xs bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary">
                    <Plus size={14} className="mr-1" /> Add Assignment
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {formData.classes.map((assignment, index) => {
                    const availableClasses = mockData.classes.filter(c => c.year === assignment.year);
                    return (
                      <div key={index} className="flex items-start gap-3 p-4 border border-border/50 rounded-lg bg-muted/10 relative group">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-muted-foreground font-semibold">Academic Year</label>
                            <CustomSelect 
                              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              value={assignment.year}
                              onChange={(e) => updateAssignment(index, 'year', e.target.value)}
                            >
                              <option value="" disabled>Select Year...</option>
                              {availableYears.map(y => <option key={y} value={y}>{formatYear(y)}</option>)}
                            </CustomSelect>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase text-muted-foreground font-semibold">Class</label>
                            <CustomSelect 
                              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                              value={assignment.name}
                              onChange={(e) => updateAssignment(index, 'name', e.target.value)}
                              disabled={!assignment.year}
                            >
                              <option value="" disabled>Select Class...</option>
                              {availableClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </CustomSelect>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-5 shrink-0" 
                          onClick={() => removeAssignment(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                  
                  {formData.classes.length === 0 && (
                    <div className="p-8 border border-dashed border-border/60 rounded-lg flex flex-col items-center justify-center text-center bg-muted/5">
                      <GraduationCap size={28} className="text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No classes assigned yet.</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Click "Add Assignment" to assign classes.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 p-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSaveCoordinator} className="shadow-sm">{editingId ? 'Update Coordinator' : 'Create Coordinator'}</Button>
          </CardFooter>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card border border-border/50 p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or ID..." 
            className="pl-9 bg-muted/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Note: Subject filter removed as per requirements */}
          <CustomSelect 
            className="flex h-10 w-full sm:w-auto items-center justify-between rounded-md border border-input bg-muted/20 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Sort: Name (A-Z)</option>
            <option value="name-desc">Sort: Name (Z-A)</option>
            <option value="recent">Sort: Recently Added</option>
          </CustomSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedCoordinators.length > 0 ? filteredAndSortedCoordinators.map(coordinator => (
          <Card key={coordinator.id} className="overflow-hidden group hover:border-primary/40 hover:shadow-md transition-all duration-300 bg-card">
            <CardHeader className="p-5 border-b border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 relative">
              <div className="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(coordinator)} className="h-8 w-8 text-muted-foreground hover:text-primary bg-background/50 backdrop-blur-sm rounded-md shadow-sm">
                  <Edit size={14} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(coordinator.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive bg-background/50 backdrop-blur-sm rounded-md shadow-sm">
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-bold text-xl shadow-inner border border-primary/10">
                  {((w) => ((w[0]?.[0] || '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase())(coordinator.name.trim().split(/\s+/))}
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">{coordinator.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1.5 font-medium">
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 rounded-sm bg-background/50 border-muted-foreground/30 text-muted-foreground">
                      ID: {coordinator.empId}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center">
                  <GraduationCap size={14} className="mr-1.5 text-primary/70" /> Assigned Classes
                </p>
                <div className="flex flex-col gap-1.5">
                  {coordinator.classes.length > 0 ? coordinator.classes.map((clsId: string) => {
                    const cls = mockData.classes.find(c => c.id === clsId);
                    if (!cls) return null;
                    return (
                      <Badge key={clsId} variant="secondary" className="w-fit font-medium bg-muted/30 text-foreground border border-border/50 px-2 py-1 flex items-center shadow-sm">
                        <span className="text-muted-foreground mr-2 text-xs">{formatYear(cls.year)}</span>
                        <span className="text-muted-foreground/40 mr-2 text-xs">→</span>
                        <span className="text-primary font-bold text-xs">{cls.name}</span>
                      </Badge>
                    );
                  }) : (
                    <span className="text-sm text-muted-foreground italic bg-muted/20 px-3 py-2 rounded-md border border-border/30 w-fit">No classes assigned</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center">
                  <Mail size={14} className="mr-1.5 text-primary/70" /> Contact Info
                </p>
                <p className="text-sm font-medium text-foreground bg-muted/30 px-3 py-2 rounded-md border border-border/50">{coordinator.email}</p>
              </div>
            </CardContent>
            <CardFooter className="p-4 bg-muted/10 border-t border-border/50 flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span className="text-xs font-semibold text-muted-foreground">Active Account</span>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                className="text-xs h-8 shadow-sm"
                onClick={() => {
                  startImpersonation(coordinator, 'coordinator');
                  navigate('/admin');
                }}
              >
                View Activity
              </Button>
            </CardFooter>
          </Card>
        )) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl">
            <Users size={48} className="text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-bold">No Coordinators Found</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              We couldn't find any coordinators matching your current search and filter criteria.
            </p>
            <Button 
              variant="outline" 
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

