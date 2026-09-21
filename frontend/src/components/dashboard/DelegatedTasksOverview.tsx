import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Briefcase, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export const DelegatedTasksOverview = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/v1/faculty-delegations/me');
        if (response.data?.success) {
          setTasks(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch delegated tasks', error);
      }
    };
    fetchTasks();
  }, []);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2">Assigned Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => (
          <Card key={task.id} className="border border-indigo-500/30 shadow-sm bg-indigo-500/5 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  {task.taskPurpose || 'Faculty Management'}
                </CardTitle>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Active</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Department: <span className="font-medium text-foreground">{task.department?.name || 'Unknown'}</span>
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs text-muted-foreground mb-4">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Assigned: {format(new Date(task.assignedAt), 'MMM dd, yyyy')}
              </div>
              <Button 
                variant="default" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex justify-between items-center"
                onClick={() => navigate('/admin/faculty-management', { state: { delegatedTask: task } })}
              >
                <span>Start Task</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
