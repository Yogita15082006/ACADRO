import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { FileText, Download, Printer, Search, Loader2 } from 'lucide-react';
import api from '../../services/api';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export const ConsolidatedReportViewer = ({ open, onClose, onOpenIndividualReport }: any) => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      fetchReport();
    }
  }, [open]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/faculty-reports/consolidated');
      setReportData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load consolidated report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRows = () => {
    if (!reportData?.rows) return [];
    if (!searchQuery) return reportData.rows;
    const q = searchQuery.toLowerCase();
    return reportData.rows.filter((r: any) => 
      (r.facultyName?.toLowerCase() || '').includes(q) ||
      (r.employeeId?.toLowerCase() || '').includes(q) ||
      (r.department?.toLowerCase() || '').includes(q)
    );
  };

  const handleDownloadExcel = () => {
    try {
      const rows = getFilteredRows();
      if (rows.length === 0) {
        toast.error('No data to export');
        return;
      }

      const excelData = rows.map((r: any, index: number) => ({
        'S.No.': index + 1,
        'Employee ID': r.employeeId,
        'Faculty Name': r.facultyName,
        'Department': r.department,
        'Designation': r.designation,
        'Qualification': r.qualification,
        'Specialization': r.specialization,
        'Experience': r.experience,
        'Joining Date': r.joiningDate,
        'Official Email': r.officialEmail,
        'Phone': r.phone,
        'Coordinator Responsibility': r.coordinatorResponsibility,
        'Assigned Class/Section': r.assignedClasses,
        'Academic Year': r.academicYears,
        'Semester': r.semesters,
        'Subjects Assigned': r.assignedSubjects,
        'Overall Teaching Attendance %': r.overallAttendance,
        'Scheduled Classes': r.classesScheduled,
        'Classes Conducted': r.classesConducted,
        'Classes Missed': r.classesMissed,
        'Holiday Sessions': r.holidaySessions,
        'Events Created': r.eventsCreated,
        'Notices Published': r.noticesPublished,
        'Quizzes Created': r.quizzesCreated,
        'Assignments Created': r.assignmentsCreated,
        'Exam Coordinator Tasks': r.examCoordinatorAssignments,
        'Faculty Management Assigned Tasks': r.facultyManagementAssignedTasks
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const colWidths = Object.keys(excelData[0]).map(key => ({ wch: Math.max(key.length, 15) }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Faculty Reports');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, 'Faculty_Consolidated_Report_.xlsx');
    } catch (err) {
      toast.error('Failed to generate Excel file');
      console.error(err);
    }
  };

  const filteredRows = getFilteredRows();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 overflow-hidden bg-background print-wrapper-container">
        
        <DialogHeader className="p-4 border-b border-border bg-muted/30 print:hidden shrink-0">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <FileText className="text-primary" /> Faculty & Coordinator Consolidated Report
              </DialogTitle>
              {reportData && (
                <p className="text-sm text-muted-foreground mt-1">
                  Generated At: {new Date(reportData.generatedAt).toLocaleString()} | Total Faculty: {reportData.totalFaculty}
                </p>
              )}
            </div>
            
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  placeholder="Search faculty..." 
                  className="pl-8 h-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => window.print()} variant="outline" disabled={loading || !reportData} className="gap-2 h-9">
                <Printer size={16} /> Print Report
              </Button>
              <Button onClick={handleDownloadExcel} disabled={loading || !reportData} className="gap-2 h-9 bg-green-600 hover:bg-green-700 text-white">
                <Download size={16} /> Download Excel
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold mb-2">Faculty & Coordinator Consolidated Report</h1>
          {reportData && (
            <p className="text-sm text-gray-600">
              Generated At: {new Date(reportData.generatedAt).toLocaleString()} | Total Faculty: {reportData.totalFaculty}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 print:overflow-visible print:p-0">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading consolidated report data...</p>
            </div>
          ) : reportData && (
            <div className="border border-border rounded-lg overflow-x-auto print:border-none print:overflow-visible">
              <table className="w-full text-sm text-left border-collapse min-w-max">
                <thead className="bg-muted sticky top-0 print:static print-table-header z-10 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[50px]">S.No.</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Employee ID</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Faculty Name</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Department</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Designation</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Qualification</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Specialization</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[100px]">Experience</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Joining Date</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Official Email</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Phone</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Coordinator Responsibility</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Assigned Class/Section</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[120px]">Academic Year</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[100px]">Semester</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Subjects Assigned</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Attendance %</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Scheduled</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Conducted</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Missed</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Holiday Sessions</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Events</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Notices</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Quizzes</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[80px] text-center">Assignments</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Exam Coord Tasks</th>
                    <th className="px-3 py-2 border-b font-semibold border-r min-w-[150px]">Faculty Mgmt Tasks</th>
                    <th className="px-3 py-2 border-b font-semibold print:hidden min-w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((r: any, i: number) => (
                    <tr key={r.userId} className="hover:bg-muted/30 bg-background break-inside-avoid-row">
                      <td className="px-3 py-2 border-r">{i + 1}</td>
                      <td className="px-3 py-2 border-r font-medium text-xs whitespace-nowrap">{r.employeeId}</td>
                      <td className="px-3 py-2 border-r font-medium whitespace-nowrap">{r.facultyName}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.department}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.designation}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.qualification}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.specialization}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.experience}</td>
                      <td className="px-3 py-2 border-r text-xs whitespace-nowrap">{r.joiningDate}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.officialEmail}</td>
                      <td className="px-3 py-2 border-r text-xs">{r.phone}</td>
                      <td className="px-3 py-2 border-r text-xs">
                        {r.coordinatorResponsibility !== '-' ? (
                          <span className="text-primary font-medium">{r.coordinatorResponsibility}</span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-2 border-r text-xs truncate max-w-[150px]" title={r.assignedClasses}>{r.assignedClasses}</td>
                      <td className="px-3 py-2 border-r text-xs truncate max-w-[150px]" title={r.academicYears}>{r.academicYears}</td>
                      <td className="px-3 py-2 border-r text-xs truncate max-w-[100px]" title={r.semesters}>{r.semesters}</td>
                      <td className="px-3 py-2 border-r text-xs truncate max-w-[200px]" title={r.assignedSubjects}>
                        {r.assignedSubjects}
                      </td>
                      <td className="px-3 py-2 border-r text-center font-bold text-xs">{r.overallAttendance}%</td>
                      <td className="px-3 py-2 border-r text-center text-xs">{r.classesScheduled}</td>
                      <td className="px-3 py-2 border-r text-center text-emerald-600 text-xs">{r.classesConducted}</td>
                      <td className="px-3 py-2 border-r text-center text-red-500 text-xs">{r.classesMissed}</td>
                      <td className="px-3 py-2 border-r text-center text-xs">{r.holidaySessions}</td>
                      <td className="px-3 py-2 border-r text-center text-xs">{r.eventsCreated}</td>
                      <td className="px-3 py-2 border-r text-center text-xs">{r.noticesPublished}</td>
                      <td className="px-3 py-2 border-r text-center text-xs">{r.quizzesCreated}</td>
                      <td className="px-3 py-2 border-r text-center text-xs">{r.assignmentsCreated}</td>
                      <td className="px-3 py-2 border-r text-xs truncate max-w-[150px]" title={r.examCoordinatorAssignments}>{r.examCoordinatorAssignments}</td>
                      <td className="px-3 py-2 border-r text-xs truncate max-w-[150px]" title={r.facultyManagementAssignedTasks}>{r.facultyManagementAssignedTasks}</td>
                      <td className="px-3 py-2 print:hidden text-center">
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onOpenIndividualReport(r.userId)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={14} className="text-center py-8 text-muted-foreground">
                        No faculty reports found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
