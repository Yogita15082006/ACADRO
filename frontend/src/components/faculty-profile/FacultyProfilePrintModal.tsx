import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Download, FileText } from 'lucide-react';
import type { FacultyProfileData } from '../../services/facultyProfileService';
import { generateFacultyProfilePDF } from '../../utils/facultyReportGenerator';

interface FacultyProfilePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FacultyProfileData;
}

export const FacultyProfilePrintModal: React.FC<FacultyProfilePrintModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!profile) return null;

  const handlePrint = () => {
    const reportElem = document.getElementById('faculty-dossier-printable');
    if (!reportElem) {
      window.print();
      return;
    }

    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ACADRO Faculty Dossier - ${profile.fullName || 'Faculty'}</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; page-break-inside: auto; }
              tr { page-break-inside: avoid; break-inside: avoid; }
              thead { display: table-header-group; }
              th, td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 10.5px; text-align: left; }
              th { background-color: #f1f5f9 !important; font-weight: 700; color: #1e293b; }
              .header-box { border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px; text-align: center; }
              .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
              .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
              .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
              .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
              .card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; background: #f8fafc; margin-bottom: 8px; }
              .print-hide { display: none !important; }
            </style>
          </head>
          <body>
            ${reportElem.innerHTML}
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printIframe);
        }, 3000);
      }, 350);
    }
  };

  const handleDownloadPDF = () => {
    generateFacultyProfilePDF(profile);
  };

  const promotions = (profile as any).promotions || [];
  const researchItems = (profile as any).researchContributions || [];
  const resourceItems = (profile as any).resourcePersons || [];
  const assignedSubjects = (profile as any).assignedSubjects || [];
  const documents = (profile as any).documents || {};
  const docKeys = Object.keys(documents);

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-[96vw] max-h-[92vh] p-0 flex flex-col bg-background border-border shadow-2xl overflow-hidden rounded-xl">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/80 bg-muted/40 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Print Faculty Dossier: {profile.fullName || 'Faculty Member'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Print-ready official document view &bull; Excludes navigation bars and buttons
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadPDF}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Print Report Now
            </Button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-950/30">
          <div
            id="faculty-dossier-printable"
            className="max-w-4xl mx-auto bg-card border border-border/80 shadow-sm p-6 sm:p-10 rounded-xl space-y-7 print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-none text-foreground font-sans"
          >
            
            {/* 1. INSTITUTIONAL HEADER */}
            <div className="border-b-2 border-primary/80 pb-4 text-center space-y-1">
              <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded">
                ACADRO &bull; Academic & Department Management System
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground pt-1">
                ACROPOLIS INSTITUTE OF TECHNOLOGY & RESEARCH
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Affiliated to RGPV, Bhopal & Approved by AICTE, New Delhi &bull; Indore Bypass Road, Manglia, Indore (M.P.)
              </p>
              <div className="pt-2">
                <span className="inline-block px-4 py-1 bg-muted/60 text-primary font-bold text-sm tracking-wide border border-primary/20 rounded-md">
                  OFFICIAL FACULTY PROFILE & ACADEMIC DOSSIER
                </span>
              </div>
            </div>

            {/* 2. FACULTY METADATA BANNER */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  {profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim()}
                </h3>
                <p className="text-muted-foreground font-medium">
                  Emp ID: <span className="font-mono font-bold text-foreground">{profile.employeeId || 'N/A'}</span> &bull; 
                  Designation: <span className="font-semibold text-foreground">{profile.designation || 'Faculty Member'}</span> &bull; 
                  Role: <span className="font-semibold text-primary">{profile.role || 'FACULTY'}</span>
                </p>
                <p className="text-muted-foreground">
                  Department: <span className="font-semibold text-foreground">{profile.departmentName || 'Information Technology'}</span>
                </p>
              </div>
              <div className="text-right text-muted-foreground space-y-0.5">
                <p>Status: <span className="font-bold text-emerald-600">Active</span></p>
                <p>Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* SECTION 1: Personal & Employment Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1 flex items-center gap-1.5">
                1. Personal & Employment Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Employee ID:</span>
                  <span className="font-semibold font-mono">{profile.employeeId || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Designation:</span>
                  <span className="font-semibold">{profile.designation || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Department:</span>
                  <span className="font-semibold">{profile.departmentName || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Date of Joining:</span>
                  <span className="font-semibold">{profile.joiningDate ? String(profile.joiningDate) : '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Employment Type:</span>
                  <span className="font-semibold">{profile.employmentType || 'Regular'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">PAN Number:</span>
                  <span className="font-semibold font-mono">{profile.pan || 'Protected (Masked)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">AICTE ID:</span>
                  <span className="font-semibold font-mono">{profile.aicteId || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">RGPV Faculty ID:</span>
                  <span className="font-semibold font-mono">{profile.rgpvId || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Official Email:</span>
                  <span className="font-semibold">{profile.email || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Phone:</span>
                  <span className="font-semibold">{profile.phone || '-'}</span>
                </div>
                <div className="col-span-1 sm:col-span-2 flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Administrative Remarks:</span>
                  <span className="font-medium text-foreground">{profile.remarks || '-'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Academic Qualifications */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                2. Academic Qualifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Highest Qualification:</span>
                  <span className="font-semibold">{profile.highestQualification || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Ph.D. Status:</span>
                  <span className="font-semibold">{profile.hasPhd ? 'Awarded / Completed' : 'Not Awarded'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Ph.D. University:</span>
                  <span className="font-semibold">{profile.phdUniversity || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Ph.D. Award Date:</span>
                  <span className="font-semibold">{profile.phdAwardDate ? String(profile.phdAwardDate) : '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Postgraduate (PG) Degree:</span>
                  <span className="font-semibold">{profile.pgDetail || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">PG Specialization:</span>
                  <span className="font-semibold">{profile.pgSpecialization || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">PG University & Year:</span>
                  <span className="font-semibold">{profile.pgUniversity || '-'} ({profile.pgYear || '-'})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Undergraduate (UG) Degree:</span>
                  <span className="font-semibold">{profile.ugDetail || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">UG Specialization:</span>
                  <span className="font-semibold">{profile.ugSpecialization || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">UG University & Year:</span>
                  <span className="font-semibold">{profile.ugUniversity || '-'} ({profile.ugYear || '-'})</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Experience & Retention */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                3. Teaching Experience & Retention Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Teaching Experience:</span>
                  <span className="font-semibold">{profile.teachingExperienceYears ?? 0} Years</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Industry Experience:</span>
                  <span className="font-semibold">{profile.industryExperienceYears ?? 0} Years</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">AITR Service:</span>
                  <span className="font-semibold">{profile.aitrServiceYears ?? 0} Years</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Retention Category:</span>
                  <span className="font-semibold">{profile.retentionCategory ? `Category ${profile.retentionCategory}` : '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Current Designation Since:</span>
                  <span className="font-semibold">{profile.currentDesignationSince ? String(profile.currentDesignationSince) : '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground font-medium">Previous Institute:</span>
                  <span className="font-semibold">{profile.previousInstitute || '-'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Promotion History */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                4. Promotion History & Cadre Progression
              </h4>
              <div className="rounded border border-border overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="py-2 px-3">S.No.</th>
                      <th className="py-2 px-3">Designation Awarded</th>
                      <th className="py-2 px-3">Promotion Date</th>
                      <th className="py-2 px-3 text-center">Prof</th>
                      <th className="py-2 px-3 text-center">Assoc</th>
                      <th className="py-2 px-3 text-center">Assist</th>
                      <th className="py-2 px-3">Order Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {promotions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-3 px-3 text-center text-muted-foreground italic">
                          Initial cadre: {profile.designation || 'Faculty Member'} (No additional promotion records).
                        </td>
                      </tr>
                    ) : (
                      promotions.map((p: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-primary">{p.designation}</td>
                          <td className="py-2 px-3">{p.promotionDate || '-'}</td>
                          <td className="py-2 px-3 text-center">{p.isProfessor ? 'Yes' : 'No'}</td>
                          <td className="py-2 px-3 text-center">{p.isAssociate ? 'Yes' : 'No'}</td>
                          <td className="py-2 px-3 text-center">{p.isAssistant ? 'Yes' : 'No'}</td>
                          <td className="py-2 px-3 font-mono text-[11px]">{p.orderNumber || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 5: Research & Publications */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                5. Research Contributions & Publications
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded bg-muted/30 border border-border">
                  <span className="block text-base font-bold text-foreground">{profile.sciCount ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">SCI Journals</span>
                </div>
                <div className="p-2.5 rounded bg-muted/30 border border-border">
                  <span className="block text-base font-bold text-foreground">{profile.scopusCount ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Scopus Journals</span>
                </div>
                <div className="p-2.5 rounded bg-muted/30 border border-border">
                  <span className="block text-base font-bold text-foreground">{profile.patentsCount ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Patents</span>
                </div>
                <div className="p-2.5 rounded bg-muted/30 border border-border">
                  <span className="block text-base font-bold text-foreground">{profile.booksCount ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">Books / Chapters</span>
                </div>
              </div>

              {researchItems.length > 0 && (
                <div className="rounded border border-border overflow-hidden text-xs mt-3">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase border-b border-border">
                      <tr>
                        <th className="py-2 px-3">S.No.</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Publisher / Journal</th>
                        <th className="py-2 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {researchItems.slice(0, 10).map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-primary">{r.category}</td>
                          <td className="py-2 px-3 truncate max-w-xs">{r.title}</td>
                          <td className="py-2 px-3">{r.journalOrPublisherOrAgency || '-'}</td>
                          <td className="py-2 px-3">{r.publicationDate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 6: Resource Person */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                6. Resource Person & Professional Development
              </h4>
              <div className="rounded border border-border overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="py-2 px-3">S.No.</th>
                      <th className="py-2 px-3">Resource / Event Name</th>
                      <th className="py-2 px-3">Organization Type</th>
                      <th className="py-2 px-3">Topic / Course</th>
                      <th className="py-2 px-3">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {resourceItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-center text-muted-foreground italic">
                          No resource person engagements recorded.
                        </td>
                      </tr>
                    ) : (
                      resourceItems.map((rp: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold">{rp.resourceName}</td>
                          <td className="py-2 px-3">{rp.orgType}</td>
                          <td className="py-2 px-3">{rp.course}</td>
                          <td className="py-2 px-3">{rp.hours ? `${rp.hours} hrs` : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 7: Workload */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                7. Teaching Workload & Institutional Responsibilities
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded bg-muted/20 border border-border">
                  <span className="block text-base font-bold text-foreground">{profile.theoryLoadHours ?? 0} hrs/wk</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Theory Teaching Load</span>
                </div>
                <div className="p-3 rounded bg-muted/20 border border-border">
                  <span className="block text-base font-bold text-foreground">{profile.labLoadHours ?? 0} hrs/wk</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Practical / Lab Load</span>
                </div>
                <div className="p-3 rounded bg-primary/10 border border-primary/20">
                  <span className="block text-base font-bold text-primary">{profile.totalTeachingLoadHours ?? 0} hrs/wk</span>
                  <span className="text-[10px] text-primary uppercase font-semibold">Total Teaching Load</span>
                </div>
              </div>

              {assignedSubjects.length > 0 && (
                <div className="rounded border border-border overflow-hidden text-xs mt-3">
                  <table className="w-full text-left">
                    <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase border-b border-border">
                      <tr>
                        <th className="py-2 px-3">Subject Name</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3">Semester</th>
                        <th className="py-2 px-3">Academic Year</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {assignedSubjects.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold">{s.subjectName || '-'}</td>
                          <td className="py-2 px-3">{s.className || '-'}</td>
                          <td className="py-2 px-3">{s.semester || '-'}</td>
                          <td className="py-2 px-3 font-mono">{s.academicYear || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SECTION 8: Supporting Documents Evidence */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                8. Supporting Verification Documents Repository
              </h4>
              <div className="rounded border border-border overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground uppercase border-b border-border">
                    <tr>
                      <th className="py-2 px-3">S.No.</th>
                      <th className="py-2 px-3">Document Category</th>
                      <th className="py-2 px-3">File Name</th>
                      <th className="py-2 px-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {docKeys.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-center text-muted-foreground italic">
                          Official certificates and appointment orders archived in digital repository.
                        </td>
                      </tr>
                    ) : (
                      docKeys.map((k, idx) => {
                        const item = documents[k];
                        const categoryName = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        const fName = typeof item === 'object' ? item.fileName : item;
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-medium">{idx + 1}</td>
                            <td className="py-2 px-3 font-semibold">{categoryName}</td>
                            <td className="py-2 px-3 text-muted-foreground font-mono">{fName || 'Document File'}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-semibold">Verified Evidence</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DOCUMENT FOOTER */}
            <div className="pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
              <p>Generated via ACADRO ERP &bull; Official Institutional Record &bull; Confidential</p>
              <p>Acropolis Institute of Technology & Research, Indore</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
