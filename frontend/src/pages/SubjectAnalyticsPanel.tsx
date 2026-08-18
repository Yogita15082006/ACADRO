import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Users, ClipboardList, CheckCircle2, TrendingUp, Search, Eye, Filter, Sparkles, Calendar, Loader2 } from 'lucide-react';
import { getAssetUrl } from '@/lib/utils';
import api from "../services/api";

export const SubjectAnalyticsPanel = ({ workspaceContext }: { workspaceContext: any }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterAttendance, setFilterAttendance] = useState('All');
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!workspaceContext?.id) return;
      
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/v1/analytics/subject/${workspaceContext.id}/students`);
        if (res.data && res.data.data) {
          setStudents(res.data.data);
        } else {
          setStudents([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch analytics', err);
        setError('Failed to load analytics data for this subject.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [workspaceContext]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.enrollmentNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesGrade = true;
      if (filterGrade !== 'All') {
        matchesGrade = s.metrics.badge === filterGrade;
      }
      
      let matchesAttendance = true;
      if (filterAttendance !== 'All') {
        if (filterAttendance === '<75%') matchesAttendance = s.metrics.attendance.percentage < 75;
        if (filterAttendance === '75%-85%') matchesAttendance = s.metrics.attendance.percentage >= 75 && s.metrics.attendance.percentage <= 85;
        if (filterAttendance === '>85%') matchesAttendance = s.metrics.attendance.percentage > 85;
      }
      
      return matchesSearch && matchesGrade && matchesAttendance;
    });
  }, [students, searchQuery, filterGrade, filterAttendance]);

  const dashboardMetrics = useMemo(() => {
    if (students.length === 0) return { total: 0, excellent: 0, good: 0, average: 0, poor: 0, avgAttendance: 0, avgQuiz: 0, avgAssignment: 0 };
    
    let excellent = 0, good = 0, average = 0, poor = 0;
    let sumAttendance = 0, sumQuiz = 0, sumAssignment = 0;
    
    students.forEach(s => {
      if (s.metrics.badge === 'Excellent' || s.metrics.badge === 'Very Good') excellent++;
      else if (s.metrics.badge === 'Good') good++;
      else if (s.metrics.badge === 'Average') average++;
      else poor++;
      
      sumAttendance += s.metrics.attendance.percentage;
      sumQuiz += s.metrics.quizzes.average;
      sumAssignment += s.metrics.assignments.percentage;
    });
    
    return {
      total: students.length,
      excellent,
      good,
      average,
      poor,
      avgAttendance: Math.round(sumAttendance / students.length),
      avgQuiz: Math.round(sumQuiz / students.length),
      avgAssignment: Math.round(sumAssignment / students.length)
    };
  }, [students]);

  const handleViewProfile = (student: any) => {
    setSelectedStudent(student);
    setIsProfileModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Crunching student analytics data...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-xl border border-destructive/20 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-destructive mb-2">Error Loading Analytics</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No Students Enrolled</h3>
          <p className="text-muted-foreground">Analytics cannot be generated because there are no students enrolled in this class.</p>
        </div>
      ) : (
        <>
          {/* Top Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Students</p>
              <h3 className="text-3xl font-bold text-foreground">{dashboardMetrics.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Attendance</p>
              <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{dashboardMetrics.avgAttendance}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Assignment %</p>
              <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{dashboardMetrics.avgAssignment}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-500/5 border-indigo-500/20 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Avg Quiz Score</p>
              <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{dashboardMetrics.avgQuiz}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Performance Distribution</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-500/5 rounded-lg p-3 text-center border border-emerald-500/20">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{dashboardMetrics.excellent}</p>
              <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase">Excellent / V. Good</p>
            </div>
            <div className="bg-amber-500/5 rounded-lg p-3 text-center border border-amber-500/20">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{dashboardMetrics.good}</p>
              <p className="text-xs font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase">Good</p>
            </div>
            <div className="bg-orange-500/5 rounded-lg p-3 text-center border border-orange-500/20">
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{dashboardMetrics.average}</p>
              <p className="text-xs font-semibold text-orange-600/80 dark:text-orange-400/80 uppercase">Average</p>
            </div>
            <div className="bg-rose-500/5 rounded-lg p-3 text-center border border-rose-500/20">
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{dashboardMetrics.poor}</p>
              <p className="text-xs font-semibold text-rose-600/80 dark:text-rose-400/80 uppercase">Needs Improvement</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by student name or enrollment..." 
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Grades</SelectItem>
                <SelectItem value="Excellent">Excellent</SelectItem>
                <SelectItem value="Very Good">Very Good</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select value={filterAttendance} onValueChange={setFilterAttendance}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Attendance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Attendance</SelectItem>
              <SelectItem value=">85%">Above 85%</SelectItem>
              <SelectItem value="75%-85%">75% - 85%</SelectItem>
              <SelectItem value="<75%">Below 75%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student List Table */}
      <Card className="border border-border/50 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Enrollment No.</th>
                  <th className="px-6 py-4 font-semibold text-center">Attendance</th>
                  <th className="px-6 py-4 font-semibold text-center">Assignments</th>
                  <th className="px-6 py-4 font-semibold text-center">Quizzes</th>
                  <th className="px-6 py-4 font-semibold text-center">Overall</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => (
                    <tr key={student.id} className="hover:bg-muted/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={student.profilePictureUrl ? getAssetUrl(student.profilePictureUrl) : student.avatar ? getAssetUrl(student.avatar) : `https://ui-avatars.com/api/?name=${student.name.replace(/ /g, '+')}&background=4F46E5&color=fff&size=40`} alt={student.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-background shadow-sm" />
                          <div>
                            <p className="font-bold text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs bg-background/50 px-2 py-0.5 rounded border border-border/50 text-muted-foreground">
                          {student.enrollmentNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${student.metrics.attendance.percentage}%` }} />
                          </div>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 w-9">{student.metrics.attendance.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${student.metrics.assignments.percentage}%` }} />
                          </div>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 w-9">{student.metrics.assignments.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${student.metrics.quizzes.average}%` }} />
                          </div>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 w-9">{student.metrics.quizzes.average}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-black text-foreground">{student.metrics.overallScore}%</span>
                          <Badge variant="outline" className={`mt-1 text-[9px] uppercase leading-none py-0.5 px-1.5 border-0 ${student.metrics.badgeColor}`}>
                            {student.metrics.badge}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleViewProfile(student)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4 mr-2 text-primary" /> View Details
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      No students match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
        </>
      )}

      {/* Student Profile Detail Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Student Academic Profile</DialogTitle>
                <DialogDescription>
                  Detailed performance report for {workspaceContext.subjectName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-6">
                {/* Header Profile */}
                <div className="flex items-start gap-5 p-5 bg-muted/10 rounded-xl border border-border/50">
                  <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{selectedStudent.name}</h2>
                        <p className="text-muted-foreground font-medium">{selectedStudent.enrollmentNumber}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-primary text-primary-foreground text-base px-3 py-1 font-bold">Grade {selectedStudent.metrics.grade}</Badge>
                        <p className="text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">Overall Score: <span className="text-foreground">{selectedStudent.metrics.overallScore}%</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Badge variant="outline" className={selectedStudent.metrics.badgeColor}>{selectedStudent.metrics.badge}</Badge>
                    </div>
                  </div>
                </div>

                {/* AI Feedback Banner */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" /> AI Performance Analysis
                  </h4>
                  <p className="text-foreground/80 leading-relaxed font-medium">
                    {selectedStudent.metrics.feedback}
                  </p>
                </div>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Assignments History */}
                  <Card className="border border-border/50 shadow-sm">
                    <CardHeader className="bg-muted/10 pb-4">
                      <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4 text-blue-500" /> Assignment History</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{selectedStudent.metrics.assignments.percentage}%</span>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Completion Rate</p>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-border/50">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Assigned</span>
                            <span className="font-bold text-foreground">{selectedStudent.metrics.assignments.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Submitted</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStudent.metrics.assignments.submitted}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Pending</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">{selectedStudent.metrics.assignments.pending}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quizzes History */}
                  <Card className="border border-border/50 shadow-sm">
                    <CardHeader className="bg-muted/10 pb-4">
                      <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-500" /> Quiz History</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{selectedStudent.metrics.quizzes.average}%</span>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Average Score</p>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-border/50">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Quizzes</span>
                            <span className="font-bold text-foreground">{selectedStudent.metrics.quizzes.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Attempted</span>
                            <span className="font-bold text-foreground">{selectedStudent.metrics.quizzes.attempted}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Missed</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">{selectedStudent.metrics.quizzes.total - selectedStudent.metrics.quizzes.attempted}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Attendance History */}
                  <Card className="border border-border/50 shadow-sm">
                    <CardHeader className="bg-muted/10 pb-4">
                      <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-500" /> Attendance History</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{selectedStudent.metrics.attendance.percentage}%</span>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Attendance Rate</p>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-border/50">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Sessions</span>
                            <span className="font-bold text-foreground">{selectedStudent.metrics.attendance.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Present</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStudent.metrics.attendance.present}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Absent</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">{selectedStudent.metrics.attendance.absent}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Trend Chart Placeholder */}
                <Card className="border border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="bg-muted/10 pb-4">
                    <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Performance Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-40 w-full bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] bg-muted flex items-end px-4 gap-2 pt-10 border-t border-border/50">
                      {/* Mock bars */}
                      {[65, 70, 68, 75, 80, 85, 82, 88, 90, selectedStudent.metrics.overallScore].map((height, i) => (
                        <div key={i} className="flex-1 bg-primary/40 hover:bg-primary transition-colors rounded-t-sm" style={{ height: `${height}%` }}></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
