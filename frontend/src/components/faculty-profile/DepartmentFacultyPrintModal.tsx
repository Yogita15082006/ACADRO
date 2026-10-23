import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Building2,
  Users,
  Award,
  BookOpen,
  GraduationCap,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { facultyProfileService, type FacultyProfileData } from '../../services/facultyProfileService';
import { toast } from 'sonner';

interface DepartmentFacultyPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentName?: string;
}

export const DepartmentFacultyPrintModal: React.FC<DepartmentFacultyPrintModalProps> = ({
  isOpen,
  onClose,
  departmentName
}) => {
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [facultyList, setFacultyList] = useState<FacultyProfileData[]>([]);
  const [deptTitle, setDeptTitle] = useState<string>(departmentName || 'Department');

  useEffect(() => {
    if (isOpen) {
      loadDepartmentData();
    }
  }, [isOpen]);

  const loadDepartmentData = async () => {
    setLoading(true);
    try {
      const data = await facultyProfileService.getDepartmentFacultyProfiles();
      setFacultyList(data);
      if (data.length > 0 && data[0].departmentName) {
        setDeptTitle(data[0].departmentName);
      }
    } catch (err: any) {
      console.error('Failed to load department faculty list', err);
      toast.error(err.response?.data?.message || 'Failed to retrieve department faculty records');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await facultyProfileService.downloadDepartmentExcel();
      toast.success('Department faculty Excel report downloaded successfully');
    } catch (err: any) {
      console.error('Excel download failed', err);
      toast.error('Failed to generate Excel report');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handlePrint = () => {
    const reportElem = document.getElementById('department-roster-printable');
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
            <title>ACADRO - ${deptTitle} Department Faculty Roster</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                color: #0f172a;
                background: #fff;
                margin: 0;
                padding: 0;
                font-size: 11px;
                line-height: 1.35;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .header-box {
                border-bottom: 2px solid #1e3a8a;
                padding-bottom: 8px;
                margin-bottom: 12px;
                text-align: center;
              }
              .title-main {
                font-size: 18px;
                font-weight: 800;
                color: #0f172a;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: -0.01em;
              }
              .sub-title {
                font-size: 11px;
                color: #475569;
                margin-top: 3px;
              }
              .doc-badge {
                display: inline-block;
                padding: 3px 10px;
                background: #eff6ff;
                border: 1px solid #bfdbfe;
                color: #1e40af;
                font-weight: 700;
                font-size: 12px;
                border-radius: 4px;
                margin-top: 6px;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 8px;
                margin-bottom: 14px;
              }
              .stat-box {
                border: 1px solid #e2e8f0;
                background: #f8fafc;
                border-radius: 4px;
                padding: 6px 10px;
                text-align: center;
              }
              .stat-num {
                font-size: 16px;
                font-weight: 800;
                color: #1e3a8a;
              }
              .stat-label {
                font-size: 9px;
                text-transform: uppercase;
                font-weight: 600;
                color: #64748b;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 6px;
                margin-bottom: 16px;
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              thead {
                display: table-header-group;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 5px 6px;
                font-size: 10px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f1f5f9 !important;
                font-weight: 700;
                color: #1e293b;
                text-transform: uppercase;
                font-size: 9px;
                letter-spacing: 0.02em;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: 700; }
              .font-mono { font-family: monospace; }
              .badge-cat {
                display: inline-block;
                padding: 1px 5px;
                border-radius: 3px;
                font-weight: 700;
                font-size: 9px;
                background: #dcfce7;
                color: #15803d;
                border: 1px solid #bbf7d0;
              }
              .badge-phd {
                display: inline-block;
                padding: 1px 5px;
                border-radius: 3px;
                font-weight: 700;
                font-size: 9px;
                background: #e0e7ff;
                color: #3730a3;
                border: 1px solid #c7d2fe;
              }
              .footer {
                margin-top: 14px;
                padding-top: 8px;
                border-top: 1px solid #cbd5e1;
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                color: #64748b;
              }
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
      }, 400);
    }
  };

  // Compute departmental aggregates
  const totalFaculty = facultyList.length;
  const phdCount = facultyList.filter(f => f.hasPhd).length;
  const totalSci = facultyList.reduce((acc, f) => acc + (f.sciCount || 0), 0);
  const totalScopus = facultyList.reduce((acc, f) => acc + (f.scopusCount || 0), 0);
  const catACount = facultyList.filter(f => f.retentionCategory === 'A').length;

  return (
    <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] p-0 flex flex-col bg-background border-border shadow-2xl overflow-hidden rounded-xl">
        
        {/* Modal Header Toolbar (Excluded from print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>HOD Department Faculty Report: {deptTitle}</span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
                  HOD Access Only
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Comprehensive departmental faculty roster &bull; Print-ready view &bull; Validated server-side
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              disabled={loading || downloadingExcel}
              onClick={handleDownloadExcel}
              className="gap-1.5 text-xs shadow-sm bg-background hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
            >
              {downloadingExcel ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  Generating XLSX...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Download Excel (.xlsx)
                </>
              )}
            </Button>

            <Button
              size="sm"
              disabled={loading || facultyList.length === 0}
              onClick={handlePrint}
              className="gap-1.5 text-xs shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print All Faculty Report
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 dark:bg-slate-950/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading departmental faculty records from institutional database...
              </p>
            </div>
          ) : facultyList.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border p-8">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">No Faculty Members Found</h3>
              <p className="text-xs text-muted-foreground mt-1">
                There are no faculty members assigned to your department in the current academic records.
              </p>
            </div>
          ) : (
            <div
              id="department-roster-printable"
              className="max-w-5xl mx-auto bg-card border border-border/80 shadow-sm p-6 sm:p-10 rounded-xl space-y-6 text-foreground font-sans"
            >
              {/* INSTITUTIONAL HEADER */}
              <div className="header-box border-b-2 border-primary/80 pb-4 text-center space-y-1">
                <div className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded">
                  ACADRO &bull; Academic & Department Management System
                </div>
                <h1 className="title-main text-xl sm:text-2xl font-black tracking-tight text-foreground pt-1">
                  ACROPOLIS INSTITUTE OF TECHNOLOGY & RESEARCH
                </h1>
                <p className="sub-title text-xs text-muted-foreground font-medium">
                  Affiliated to RGPV Bhopal & Approved by AICTE New Delhi &bull; Indore Bypass Road, Manglia, Indore (M.P.)
                </p>
                <div className="pt-2">
                  <span className="doc-badge inline-block px-4 py-1.5 bg-primary/10 text-primary font-bold text-sm tracking-wide border border-primary/20 rounded-md uppercase">
                    DEPARTMENT FACULTY COMPREHENSIVE REPORT — {deptTitle}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground pt-1">
                  Report Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; Department Faculty Strength: {totalFaculty}
                </div>
              </div>

              {/* STATS OVERVIEW CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                  <div className="text-xl font-extrabold text-primary">{totalFaculty}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">Total Faculty</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                  <div className="text-xl font-extrabold text-indigo-600">{phdCount}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">Ph.D. Holders</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                  <div className="text-xl font-extrabold text-emerald-600">{catACount}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">Retention Cat A</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                  <div className="text-xl font-extrabold text-sky-600">{totalSci}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">SCI Publications</div>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-muted/20">
                  <div className="text-xl font-extrabold text-purple-600">{totalScopus}</div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">Scopus Papers</div>
                </div>
              </div>

              {/* FACULTY ROSTER TABLE */}
              <div className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground border-b border-border/80 pb-1.5 flex items-center justify-between">
                  <span>1. Faculty Staff Cadre & Qualification Roster</span>
                  <span className="text-xs font-normal text-muted-foreground font-mono">
                    Showing all {totalFaculty} department members
                  </span>
                </h2>

                <div className="overflow-x-auto rounded-lg border border-border/80">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/70 text-muted-foreground font-bold border-b border-border/80 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Emp ID</th>
                        <th className="py-2.5 px-3">Faculty Name</th>
                        <th className="py-2.5 px-3">Cadre / Designation</th>
                        <th className="py-2.5 px-3">Highest Qual</th>
                        <th className="py-2.5 px-3">Ph.D. Univ</th>
                        <th className="py-2.5 px-3 text-center">Exp (Acro / Tot)</th>
                        <th className="py-2.5 px-3 text-center">Ret. Cat</th>
                        <th className="py-2.5 px-3 text-center">SCI / Scopus</th>
                        <th className="py-2.5 px-3 text-center">Load (hrs)</th>
                        <th className="py-2.5 px-3">Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {facultyList.map((fac, idx) => (
                        <tr key={fac.id || idx} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 text-center font-semibold text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-bold text-primary">{fac.employeeId}</td>
                          <td className="py-2 px-3 font-semibold text-foreground">
                            {fac.fullName || `${fac.firstName || ''} ${fac.lastName || ''}`.trim()}
                          </td>
                          <td className="py-2 px-3 font-medium text-foreground">{fac.designation || 'Faculty'}</td>
                          <td className="py-2 px-3">{fac.highestQualification || '—'}</td>
                          <td className="py-2 px-3">
                            {fac.hasPhd ? (
                              <span className="badge-phd font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
                                {fac.phdUniversity || 'Ph.D.'}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">No</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            {fac.experienceAcropolis != null ? fac.experienceAcropolis : '0'}y / {fac.totalExperience != null ? fac.totalExperience : '0'}y
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="badge-cat font-bold px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Cat {fac.retentionCategory || 'A'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-medium">
                            <span className="text-sky-600 font-bold">{fac.sciCount || 0}</span> / <span className="text-purple-600 font-bold">{fac.scopusCount || 0}</span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-foreground">
                            {fac.totalTeachingLoadHours || 0}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-muted-foreground">
                            <div className="truncate max-w-[150px]">{fac.email}</div>
                            {fac.phone && <div className="text-[10px] text-muted-foreground">{fac.phone}</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 2: RESEARCH SUMMARY */}
              <div className="space-y-2 pt-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-foreground border-b border-border/80 pb-1.5">
                  2. Department Research & Publications Overview
                </h2>
                <div className="p-3 bg-muted/20 rounded-lg border border-border/80 text-xs flex flex-wrap gap-6 items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Total SCI Journal Publications: </span>
                    <strong className="text-sky-600 font-bold text-sm ml-1">{totalSci}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Scopus Indexed Publications: </span>
                    <strong className="text-purple-600 font-bold text-sm ml-1">{totalScopus}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cumulative Scholarly Output: </span>
                    <strong className="text-primary font-bold text-sm ml-1">{totalSci + totalScopus} papers</strong>
                  </div>
                </div>
              </div>

              {/* REPORT FOOTER */}
              <div className="footer pt-6 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground gap-2">
                <p>Generated via ACADRO ERP &bull; Official Department Roster &bull; Confidential &bull; For HOD & Administrative Use Only</p>
                <p>Acropolis Institute of Technology & Research, Indore</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
