import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { coordinatorAttendanceService } from '../../services/coordinatorAttendanceService';
import type { CoordinatorLecture, CoordinatorEvent, CoordinatorStudent } from '../../services/coordinatorAttendanceService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  students: CoordinatorStudent[];
}

export const CoordinatorAddAttendanceModal = ({ isOpen, onClose, onSuccess, students }: Props) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<CoordinatorLecture[]>([]);
  const [events, setEvents] = useState<CoordinatorEvent[]>([]);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const handleNextToStep2 = async () => {
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    setLoading(true);
    try {
      const schedule = await coordinatorAttendanceService.getScheduleForDate(date);
      setLectures(schedule.lectures);
      setEvents(schedule.events);
      if (schedule.lectures.length === 0 && schedule.events.length === 0) {
        toast.warning('No lectures or events found for this date.');
      }
      setStep(2);
    } catch (error) {
      toast.error('Failed to fetch schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleNextToStep3 = () => {
    if (selectedSessionIds.length === 0 && selectedEventIds.length === 0) {
      toast.error('Please select at least one lecture or event');
      return;
    }
    // Select all students by default
    setSelectedStudentIds(students.map(s => s.id));
    setStep(3);
  };

  const handleNextToReview = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    setStep(4);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await coordinatorAttendanceService.addBulkAttendance({
        date,
        studentIds: selectedStudentIds,
        sessionIds: selectedSessionIds,
        eventIds: selectedEventIds
      });
      toast.success('Attendance marked successfully!');
      window.dispatchEvent(new Event('sync-attendance-data'));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(prev => prev.filter(sId => sId !== id));
    } else {
      setSelectedStudentIds(prev => [...prev, id]);
    }
  };

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s.id));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Add Attendance</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Select Date</h3>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            <div className="flex justify-end pt-4">
              <Button onClick={handleNextToStep2} disabled={loading || !date}>
                {loading ? 'Fetching...' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Select Lectures & Events for {date}</h3>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-muted-foreground">Lectures</h4>
              {lectures.length === 0 ? <p className="text-sm text-muted-foreground">No lectures scheduled.</p> : null}
              {lectures.map(lecture => (
                <div key={lecture.id} className="flex items-center space-x-2 bg-muted/50 p-3 rounded-md">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedSessionIds.includes(lecture.id)} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) setSelectedSessionIds([...selectedSessionIds, lecture.id]);
                      else setSelectedSessionIds(selectedSessionIds.filter(id => id !== lecture.id));
                    }} 
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{lecture.subject} (Lec {lecture.lectureNumber})</span>
                    <span className="text-sm text-muted-foreground">{lecture.faculty} | {lecture.startTime} - {lecture.endTime}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-muted-foreground">Events</h4>
              {events.length === 0 ? <p className="text-sm text-muted-foreground">No events scheduled.</p> : null}
              {events.map(event => (
                <div key={event.id} className="flex items-center space-x-2 bg-muted/50 p-3 rounded-md">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedEventIds.includes(event.id)} 
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) setSelectedEventIds([...selectedEventIds, event.id]);
                      else setSelectedEventIds(selectedEventIds.filter(id => id !== event.id));
                    }} 
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{event.title}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleNextToStep3}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Select Students</h3>
              <div className="flex items-center space-x-2">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={selectedStudentIds.length === students.length} onChange={toggleAllStudents} />
                <span className="text-sm font-medium">Select All</span>
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {students.map(student => (
                <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer" onClick={() => toggleStudent(student.id)}>
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" checked={selectedStudentIds.includes(student.id)} readOnly />
                  <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                     {student.photo ? <img src={student.photo} alt={student.name} /> : <span>{student.name.charAt(0)}</span>}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.enrollmentNumber}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={handleNextToReview}>Review</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Review & Submit</h3>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p><span className="font-semibold">Date:</span> {date}</p>
              <p><span className="font-semibold">Lectures Selected:</span> {selectedSessionIds.length}</p>
              <p><span className="font-semibold">Events Selected:</span> {selectedEventIds.length}</p>
              <p><span className="font-semibold">Students Selected:</span> {selectedStudentIds.length} / {students.length}</p>
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button onClick={handleSubmit} disabled={loading} className="bg-primary text-primary-foreground">
                {loading ? 'Submitting...' : 'Confirm Attendance'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
