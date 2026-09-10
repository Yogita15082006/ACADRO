import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Download, User, BookOpen, Clock, Calendar, CheckCircle, Shield, GraduationCap, XCircle, Printer, Activity, Briefcase } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const FacultyReportViewer = ({ open, facultyId, onClose }: any) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && facultyId) {
      fetchReport();
    } else {
      setReportData(null);
    }
  }, [open, facultyId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/v1/faculty-reports/${facultyId}`);
      setReportData(res.data?.data || res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch faculty report');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const { profile, responsibilities, teachingSummary, teachingHistory, teachingExceptions, subjectAssignments, events, notices, quizzes, assignments, examCoordinatorHistory, facultyManagementTaskHistory, recentActivity } = reportData;

    // Helper functions
    const addPageIfNeeded = (requiredHeight: number) => {
      const pageHeight = doc.internal.pageSize.height;
      if (currentY + requiredHeight > pageHeight - 15) {
        doc.addPage();
        currentY = 20;
        addFooter();
      }
    };

    const addFooter = () => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerText = `ACADRO Faculty Report | Employee ID: ${profile.employeeId || 'N/A'} | Page ${i} of ${pageCount}`;
        const pageWidth = doc.internal.pageSize.width;
        doc.text(footerText, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    };

    let currentY = 20;

    // HEADER
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41);
    doc.text('ACADRO', 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Academic & Department Management System', 14, currentY);
    currentY += 10;
    
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 204);
    doc.text('Faculty Performance & Activity Report', 14, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.setTextColor(50);
    const generatedOn = `Generated On: ${new Date().toLocaleString()}`;
    doc.text(generatedOn, 14, currentY);
    currentY += 12;

    // SECTION 1: Profile
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Faculty Profile', 14, currentY);
    currentY += 6;

    const profileData = [
      ['Faculty Name', `${profile.firstName || ''} ${profile.lastName || ''}`.trim(), 'Employee ID', profile.employeeId || '-'],
      ['Status', profile.status || '-', 'Designation', profile.designation || '-'],
      ['Department', profile.departmentName || '-', 'Assigned Depts', profile.additionalDepartments?.length ? profile.additionalDepartments.join(', ') : (profile.departmentName || '-')],
      ['Qualification', profile.qualification || '-', 'Experience', profile.experienceYears != null ? `${profile.experienceYears} Years` : '-'],
      ['Joining Date', profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : '-', 'Expertise Areas', profile.expertiseAreas?.length ? profile.expertiseAreas.join(', ') : '-'],
      ['Official Email', profile.email || '-', 'Personal Email', profile.personalEmail || '-'],
      ['Phone', profile.phone || '-', 'WhatsApp', profile.whatsappNumber || '-']
    ];

    autoTable(doc, {
      startY: currentY,
      body: profileData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 35 },
        1: { cellWidth: 60 },
        2: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 35 },
        3: { cellWidth: 60 }
      }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // SECTION 2: Current Responsibilities
    if (responsibilities) {
      addPageIfNeeded(20);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('2. Current Responsibilities', 14, currentY);
      currentY += 6;
      
      const respData = [
        ['Current Roles', responsibilities.currentRoles?.length ? responsibilities.currentRoles.join(', ') : '-'],
        ['Coordinator For Classes', responsibilities.coordinatorForClasses?.length ? responsibilities.coordinatorForClasses.join(', ') : '-'],
        ['Active Delegated Tasks', responsibilities.activeDelegatedTasks != null ? String(responsibilities.activeDelegatedTasks) : '0']
      ];
      autoTable(doc, {
        startY: currentY,
        body: respData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 45 } }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // SECTION 3: Performance Summary
    if (teachingSummary) {
      addPageIfNeeded(30);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('3. Performance Summary', 14, currentY);
      currentY += 6;

      const summaryData = [
        ['Overall Attendance', `${teachingSummary.overallAttendancePercentage || 0}%`, 'Working Days', String(teachingSummary.totalWorkingDays || 0)],
        ['Present Days', String(teachingSummary.totalPresentDays || 0), 'Absent Days', String(teachingSummary.totalAbsentDays || 0)],
        ['Classes Scheduled', String(teachingSummary.totalClassesScheduled || 0), 'Classes Conducted', String(teachingSummary.totalClassesConducted || 0)],
        ['Classes Missed', String(teachingSummary.totalClassesMissed || 0), 'Holiday Sessions', String(teachingSummary.totalHolidaySessions || 0)]
      ];
      autoTable(doc, {
        startY: currentY,
        body: summaryData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245] }, 2: { fontStyle: 'bold', fillColor: [245, 245, 245] } }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Function to render generic tables
    const renderTableSection = (title: string, dataArray: any[], head: string[][], mapRow: (item: any) => any[]) => {
      addPageIfNeeded(20);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, 14, currentY);
      currentY += 6;
      if (dataArray && dataArray.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: head,
          body: dataArray.map(mapRow),
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(120);
        doc.text('No records found.', 14, currentY);
        doc.setFont("helvetica", "normal");
        currentY += 10;
      }
    };

    renderTableSection('4. Teaching History', teachingHistory, 
      [['Subject', 'Class', 'Scheduled', 'Conducted', 'Missed', 'Attendance']], 
      (t) => [t.subjectName, t.className, String(t.totalScheduled), String(t.conducted), String(t.missed), `${t.overallAttendance}%`]
    );

    renderTableSection('5. Teaching Exceptions / Holidays', teachingExceptions, 
      [['Date', 'Subject', 'Class', 'Status', 'Remark']], 
      (te) => [new Date(te.date).toLocaleDateString(), te.subjectName || '-', te.className || '-', te.status || '-', te.remark || '-']
    );

    renderTableSection('6. Subjects & Classes', subjectAssignments, 
      [['Subject Code', 'Subject Name', 'Class', 'Sem', 'Batch']], 
      (s) => [s.subjectCode, s.subjectName, s.className, s.semester || '-', s.batchYear || '-']
    );

    renderTableSection('7. Events Created', events, 
      [['Event Name', 'Date', 'Target Classes', 'Role', 'Status']], 
      (e) => [e.eventName, new Date(e.eventDate).toLocaleDateString(), e.targetClasses || '-', e.role || 'Creator', e.status]
    );

    renderTableSection('8. Notices Published', notices, 
      [['Title', 'Type / Module', 'Related Entity', 'Date', 'Status']], 
      (n) => [n.title, n.moduleType, n.relatedEntity || '-', new Date(n.publishDate).toLocaleDateString(), n.status || '-']
    );

    renderTableSection('9. Quizzes Conducted', quizzes, 
      [['Quiz Title', 'Subject', 'Class', 'Date']], 
      (q) => [q.title, q.subjectName || '-', q.className || '-', new Date(q.startTime).toLocaleDateString()]
    );

    renderTableSection('10. Assignments Created', assignments, 
      [['Assignment Title', 'Subject', 'Class', 'Due Date', 'Submissions']], 
      (a) => [a.title, a.subjectName || '-', a.className || '-', a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-', String(a.submissionCount || 0)]
    );

    renderTableSection('11. Examination & Coordinator Activity', examCoordinatorHistory, 
      [['Purpose', 'Department', 'Assigned By', 'Assigned Date', 'Valid Until', 'Status']], 
      (ex) => [ex.examPurpose || '-', ex.departmentName || '-', ex.assignedBy || '-', ex.assignedAt ? new Date(ex.assignedAt).toLocaleDateString() : '-', ex.validUntil ? new Date(ex.validUntil).toLocaleDateString() : '-', ex.status || '-']
    );

    renderTableSection('12. Faculty Management Assigned Tasks', facultyManagementTaskHistory, 
      [['Task Purpose', 'Assigned By', 'Assigned At', 'Valid Until', 'Completed At', 'Status']], 
      (t) => [t.taskPurpose || '-', t.assignedBy || '-', t.assignedAt ? new Date(t.assignedAt).toLocaleDateString() : '-', t.validUntil ? new Date(t.validUntil).toLocaleDateString() : '-', t.completedAt ? new Date(t.completedAt).toLocaleDateString() : '-', t.status || '-']
    );

    renderTableSection('13. Recent Activity', recentActivity, 
      [['Date/Time', 'Module', 'Activity', 'Details']], 
      (ra) => [new Date(ra.date).toLocaleString(), ra.module || '-', ra.activityType || '-', ra.details || '-']
    );

    // Apply footers globally
    addFooter();

    // Save with sanitized filename
    const safeFirstName = (profile.firstName || 'Faculty').replace(/[^a-zA-Z0-9]/g, '');
    const safeLastName = (profile.lastName || '').replace(/[^a-zA-Z0-9]/g, '');
    const safeEmpId = (profile.employeeId || 'Unknown').replace(/[^a-zA-Z0-9]/g, '');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Faculty_Report_${safeFirstName}_${safeLastName}_${safeEmpId}_${dateStr}.pdf`;
    
    doc.save(filename);
    toast.success('Report downloaded successfully!');
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background print-wrapper-container">
        <DialogHeader className="p-6 border-b border-border bg-muted/30 hide-on-print">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="text-primary" /> Complete Faculty Report
            </DialogTitle>
            <div className="flex gap-2">
              <Button onClick={generatePDF} disabled={loading || !reportData} className="gap-2 shadow-sm">
                <Download size={16} /> Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 hide-on-print">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">Compiling comprehensive report from all modules...</p>
          </div>
        ) : reportData ? (
          <div className="flex-1 p-6 overflow-y-auto print-content-area custom-scrollbar">
            <div className="space-y-8 print-section">
              {/* Profile Section */}
              <div className="bg-card border border-border shadow-sm rounded-xl p-6 relative overflow-hidden break-inside-avoid">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 hide-on-print" />
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl ring-4 ring-primary/5 shrink-0">
                    {reportData.profile.firstName?.[0]}{reportData.profile.lastName?.[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">
                      {reportData.profile.firstName} {reportData.profile.lastName}
                    </h2>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge variant="secondary">{reportData.profile.designation || 'Faculty'}</Badge>
                      {reportData.profile.gender && <Badge variant="outline">{reportData.profile.gender}</Badge>}
                      <Badge variant="outline">{reportData.profile.status || '-'}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                      <User size={18} /> Professional Details
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                      <div className="text-muted-foreground">Employee ID:</div>
                      <div className="font-medium text-foreground">{reportData.profile.employeeId || '-'}</div>
                      <div className="text-muted-foreground">Department:</div>
                      <div className="font-medium text-foreground">{reportData.profile.departmentName || '-'}</div>
                      <div className="text-muted-foreground">Qualification:</div>
                      <div className="font-medium text-foreground">{reportData.profile.qualification || '-'}</div>
                      <div className="text-muted-foreground">Experience:</div>
                      <div className="font-medium text-foreground">{reportData.profile.experienceYears != null ? `${reportData.profile.experienceYears} Years` : '-'}</div>
                      <div className="text-muted-foreground">Joining Date:</div>
                      <div className="font-medium text-foreground">{reportData.profile.joiningDate ? new Date(reportData.profile.joiningDate).toLocaleDateString() : '-'}</div>
                      <div className="text-muted-foreground">Expertise:</div>
                      <div className="font-medium text-foreground">{reportData.profile.expertiseAreas?.length ? reportData.profile.expertiseAreas.join(', ') : '-'}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-primary">
                      <BookOpen size={18} /> Contact & Scope
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                      <div className="text-muted-foreground">Official Email:</div>
                      <div className="font-medium text-foreground break-all">{reportData.profile.email || '-'}</div>
                      <div className="text-muted-foreground">Personal Email:</div>
                      <div className="font-medium text-foreground break-all">{reportData.profile.personalEmail || '-'}</div>
                      <div className="text-muted-foreground">Phone:</div>
                      <div className="font-medium text-foreground">{reportData.profile.phone || '-'}</div>
                      <div className="text-muted-foreground">WhatsApp:</div>
                      <div className="font-medium text-foreground">{reportData.profile.whatsappNumber || '-'}</div>
                      <div className="text-muted-foreground">Assigned Departments:</div>
                      <div className="font-medium text-foreground">{reportData.profile.additionalDepartments?.length ? reportData.profile.additionalDepartments.join(', ') : reportData.profile.departmentName || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Responsibilities */}
              {reportData.responsibilities && (
                <div className="bg-card border border-border shadow-sm rounded-xl p-6 break-inside-avoid">
                  <h3 className="font-semibold text-lg flex items-center gap-2 text-primary mb-4">
                    <Briefcase size={18} /> Current Responsibilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="bg-muted/30 p-4 rounded-lg">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Roles</p>
                       <p className="font-medium text-sm">{reportData.responsibilities.currentRoles?.length ? reportData.responsibilities.currentRoles.join(', ') : '-'}</p>
                     </div>
                     <div className="bg-muted/30 p-4 rounded-lg">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Coordinator For</p>
                       <p className="font-medium text-sm">{reportData.responsibilities.coordinatorForClasses?.length ? reportData.responsibilities.coordinatorForClasses.join(', ') : '-'}</p>
                     </div>
                     <div className="bg-muted/30 p-4 rounded-lg">
                       <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Delegated Tasks</p>
                       <p className="font-medium text-sm">{reportData.responsibilities.activeDelegatedTasks ?? '0'}</p>
                     </div>
                  </div>
                </div>
              )}

              {/* Teaching Summary */}
              <div className="space-y-3 break-inside-avoid">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <BookOpen size={18} className="text-primary" /> Teaching Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border md:col-span-1 flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground font-medium">Overall Attendance</p>
                    <p className="text-2xl font-bold text-primary">{reportData.teachingSummary.overallAttendancePercentage || 0}%</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground font-medium">Scheduled</p>
                    <p className="text-xl font-bold mt-1 text-foreground">{reportData.teachingSummary.totalClassesScheduled ?? 0}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground font-medium">Conducted</p>
                    <p className="text-xl font-bold mt-1 text-emerald-600">{reportData.teachingSummary.totalClassesConducted ?? 0}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground font-medium">Missed</p>
                    <p className="text-xl font-bold mt-1 text-red-500">{reportData.teachingSummary.totalClassesMissed ?? 0}</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground font-medium">Absent/Leave</p>
                    <p className="text-xl font-bold mt-1 text-amber-500">{reportData.teachingSummary.totalAbsentDays ?? 0}</p>
                  </div>
                </div>
              </div>
              
              {/* Teaching History */}
              <div className="space-y-3 break-inside-avoid">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock size={18} className="text-primary" /> Teaching History
                </h3>
                <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                  {reportData.teachingHistory?.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto print-unconstrained">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0 print-table-header">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium">Subject</th>
                            <th className="px-3 py-2 text-left font-medium">Class</th>
                            <th className="px-3 py-2 text-right font-medium">Scheduled</th>
                            <th className="px-3 py-2 text-right font-medium">Conducted</th>
                            <th className="px-3 py-2 text-right font-medium">Missed</th>
                            <th className="px-3 py-2 text-right font-medium">Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {reportData.teachingHistory.map((t: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/50 bg-background break-inside-avoid-row">
                              <td className="px-3 py-2 font-medium">{t.subjectName}</td>
                              <td className="px-3 py-2 text-muted-foreground">{t.className}</td>
                              <td className="px-3 py-2 text-right">{t.totalScheduled}</td>
                              <td className="px-3 py-2 text-right text-emerald-600">{t.conducted}</td>
                              <td className="px-3 py-2 text-right text-red-500">{t.missed}</td>
                              <td className="px-3 py-2 text-right">{t.overallAttendance}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-sm italic">
                      No teaching history found.
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 1: Subject Assignments & Exceptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-flex-col">
                <div className="space-y-3 break-inside-avoid w-full">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" /> Subject Assignments
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border p-2">
                    {reportData.subjectAssignments?.length > 0 ? (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 print-unconstrained">
                        {reportData.subjectAssignments.map((sub: any, i: number) => (
                          <div key={i} className="bg-background p-3 rounded-lg border border-border/50 text-sm flex justify-between items-center break-inside-avoid-row">
                            <div>
                              <p className="font-semibold">{sub.subjectName}</p>
                              <p className="text-xs text-muted-foreground">{sub.subjectCode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{sub.className}</p>
                              <p className="text-xs text-muted-foreground">Sem {sub.semester} • {sub.batchYear}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm italic">
                        No active subject assignments found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 break-inside-avoid w-full">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <XCircle size={18} className="text-primary" /> Teaching Exceptions
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                    {reportData.teachingExceptions?.length > 0 ? (
                      <div className="max-h-[250px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0 print-table-header">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Date</th>
                              <th className="px-3 py-2 text-left font-medium">Class/Sub</th>
                              <th className="px-3 py-2 text-right font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.teachingExceptions.map((te: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/50 bg-background break-inside-avoid-row">
                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                  {new Date(te.date).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2">
                                  <p className="font-medium truncate max-w-[120px] print-no-truncate" title={te.className}>{te.className}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px] print-no-truncate">{te.subjectName}</p>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Badge variant={te.status === 'HOLIDAY' ? 'outline' : 'secondary'} className={te.status === 'HOLIDAY' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'bg-red-50 text-red-700 hover:bg-red-50'}>
                                    {te.status.replace('_', ' ')}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground text-sm italic">
                        No teaching exceptions found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 2: Events & Notices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-flex-col">
                <div className="space-y-3 break-inside-avoid w-full">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Calendar size={18} className="text-primary" /> Events Created
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                    {reportData.events?.length > 0 ? (
                      <div className="max-h-[250px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0 print-table-header">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Name</th>
                              <th className="px-3 py-2 text-left font-medium">Date</th>
                              <th className="px-3 py-2 text-right font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.events.map((e: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/50 bg-background break-inside-avoid-row">
                                <td className="px-3 py-2">
                                  <p className="font-medium truncate max-w-[120px] print-no-truncate" title={e.eventName}>{e.eventName}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px] print-no-truncate">{e.targetClasses}</p>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                                  {new Date(e.eventDate).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Badge variant="outline" className={e.status === 'ACTIVE' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}>{e.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-sm italic">
                        No events created.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 break-inside-avoid w-full">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Notices Published
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                    {reportData.notices?.length > 0 ? (
                      <div className="max-h-[250px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0 print-table-header">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Title</th>
                              <th className="px-3 py-2 text-left font-medium">Type</th>
                              <th className="px-3 py-2 text-right font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.notices.map((n: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/50 bg-background break-inside-avoid-row">
                                <td className="px-3 py-2">
                                  <p className="font-medium truncate max-w-[120px] print-no-truncate" title={n.title}>{n.title}</p>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground text-xs">
                                  {n.moduleType}
                                </td>
                                <td className="px-3 py-2 text-right text-xs whitespace-nowrap">
                                  {new Date(n.publishDate).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground text-sm italic">
                        No notices published.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 3: Quizzes & Assignments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-flex-col">
                <div className="space-y-3 break-inside-avoid w-full">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Assignments Created
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                    {reportData.assignments?.length > 0 ? (
                      <div className="max-h-[250px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0 print-table-header">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Title</th>
                              <th className="px-3 py-2 text-left font-medium">Class</th>
                              <th className="px-3 py-2 text-right font-medium">Subs</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.assignments.map((a: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/50 bg-background break-inside-avoid-row">
                                <td className="px-3 py-2">
                                  <p className="font-medium truncate max-w-[150px] print-no-truncate" title={a.title}>{a.title}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[150px] print-no-truncate">{a.subjectName}</p>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{a.className}</td>
                                <td className="px-3 py-2 text-right">
                                  <Badge variant="secondary" className="font-mono">{a.submissionCount}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground text-sm italic">
                        No assignments created yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 break-inside-avoid w-full">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CheckCircle size={18} className="text-primary" /> Quizzes Conducted
                  </h3>
                  <div className="bg-muted/30 rounded-xl border border-border overflow-hidden">
                    {reportData.quizzes?.length > 0 ? (
                      <div className="max-h-[250px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted sticky top-0 print-table-header">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Title</th>
                              <th className="px-3 py-2 text-left font-medium">Class</th>
                              <th className="px-3 py-2 text-right font-medium">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.quizzes.map((q: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/50 bg-background break-inside-avoid-row">
                                <td className="px-3 py-2">
                                  <p className="font-medium truncate max-w-[150px] print-no-truncate" title={q.title}>{q.title}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[150px] print-no-truncate">{q.subjectName}</p>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{q.className}</td>
                                <td className="px-3 py-2 text-right whitespace-nowrap text-xs">
                                  {new Date(q.startTime).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground text-sm italic">
                        No quizzes conducted yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Administrative Responsibilities & Examination Activity */}
              <div className="space-y-6">
                <div className="space-y-3 break-inside-avoid">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText size={18} className="text-primary" /> Examination & Coordinator Activity
                  </h3>
                  <div className="bg-card border border-border rounded-xl p-1 shadow-sm">
                    {reportData.examCoordinatorHistory?.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-muted-foreground sticky top-0 print-table-header">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Purpose</th>
                              <th className="px-4 py-3 text-left font-semibold">Department</th>
                              <th className="px-4 py-3 text-left font-semibold">Assigned By</th>
                              <th className="px-4 py-3 text-left font-semibold">Valid Until</th>
                              <th className="px-4 py-3 text-right font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.examCoordinatorHistory.map((ex: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/30 break-inside-avoid-row">
                                <td className="px-4 py-3 font-medium">{ex.examPurpose}</td>
                                <td className="px-4 py-3 text-muted-foreground">{ex.departmentName}</td>
                                <td className="px-4 py-3 text-muted-foreground">{ex.assignedBy}</td>
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                  {ex.validUntil ? new Date(ex.validUntil).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <Badge variant="secondary">{ex.status}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm italic flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                            <FileText className="text-muted-foreground/50" size={24} />
                        </div>
                        No examination activity recorded.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 break-inside-avoid">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield size={18} className="text-primary" /> Faculty Management Assigned Tasks
                  </h3>
                  <div className="bg-card border border-border rounded-xl p-1 shadow-sm">
                    {reportData.facultyManagementTaskHistory?.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-muted-foreground sticky top-0 print-table-header">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Task Description</th>
                              <th className="px-4 py-3 text-left font-semibold">Assigned By</th>
                              <th className="px-4 py-3 text-left font-semibold">Status</th>
                              <th className="px-4 py-3 text-right font-semibold">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.facultyManagementTaskHistory.map((t: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/30 break-inside-avoid-row">
                                <td className="px-4 py-3 font-medium">{t.taskPurpose}</td>
                                <td className="px-4 py-3 text-muted-foreground flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-primary/20 text-[10px] flex items-center justify-center font-bold text-primary hide-on-print">
                                        {t.assignedBy?.[0] || 'A'}
                                    </div>
                                    {t.assignedBy}
                                </td>
                                <td className="px-4 py-3">
                                  {t.status === 'COMPLETED' ? (
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50"><CheckCircle size={10} className="mr-1 hide-on-print"/> Completed</Badge>
                                  ) : t.status === 'ACTIVE' ? (
                                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Active</Badge>
                                  ) : (
                                    <Badge variant="secondary">{t.status}</Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                                  {new Date(t.assignedAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm italic flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2 hide-on-print">
                              <Shield className="text-muted-foreground/50" size={24} />
                          </div>
                          No administrative tasks assigned to this faculty.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 break-inside-avoid">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Activity size={18} className="text-primary" /> Recent Activity
                  </h3>
                  <div className="bg-card border border-border rounded-xl p-1 shadow-sm">
                    {reportData.recentActivity?.length > 0 ? (
                      <div className="max-h-[300px] overflow-y-auto print-unconstrained">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 text-muted-foreground sticky top-0 print-table-header">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Date/Time</th>
                              <th className="px-4 py-3 text-left font-semibold">Module</th>
                              <th className="px-4 py-3 text-left font-semibold">Activity</th>
                              <th className="px-4 py-3 text-left font-semibold">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {reportData.recentActivity.map((ra: any, i: number) => (
                              <tr key={i} className="hover:bg-muted/30 break-inside-avoid-row">
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(ra.date).toLocaleString()}</td>
                                <td className="px-4 py-3"><Badge variant="secondary">{ra.module}</Badge></td>
                                <td className="px-4 py-3 font-medium">{ra.activityType}</td>
                                <td className="px-4 py-3 text-muted-foreground text-sm">{ra.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm italic flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2 hide-on-print">
                              <Activity className="text-muted-foreground/50" size={24} />
                          </div>
                          No recent activity recorded.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="h-6"></div> {/* Bottom padding */}
            </div>
          </div>
        ) : null}
      </DialogContent>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          /* Only show the print container and its descendants */
          .print-wrapper-container, 
          .print-wrapper-container * {
            visibility: visible;
          }
          
          /* Reset container sizing and positioning for natural flow */
          .print-wrapper-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: visible !important;
          }

          /* Hide specific UI elements not meant for print */
          .hide-on-print {
            display: none !important;
          }
          
          /* Ensure content area flows naturally without scrollbars */
          .print-content-area {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            padding: 10px !important;
          }
          
          .print-unconstrained {
            max-height: none !important;
            overflow: visible !important;
          }

          /* Handle page breaks gracefully */
          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .break-inside-avoid-row {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .print-flex-col {
            display: block !important;
          }
          
          .print-flex-col > div {
            width: 100% !important;
            margin-bottom: 20px;
          }
          
          .print-no-truncate {
            white-space: normal !important;
            overflow: visible !important;
            max-width: none !important;
          }
          
          /* Show full text, no ellipsis */
          .truncate {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          
          /* Fix table headers repeating nicely */
          .print-table-header {
            display: table-header-group;
          }
          
          table {
            page-break-inside: auto;
            width: 100%;
          }
          
          /* Dark text for better print contrast */
          .text-muted-foreground {
            color: #444 !important;
          }
        }
      `}</style>
    </Dialog>
  );
};
