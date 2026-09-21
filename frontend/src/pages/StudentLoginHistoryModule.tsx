import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentLoginHistoryService } from '../services/studentLoginHistoryService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  History, Download, Printer, Search, Loader2, Eye, ChevronDown, Users, Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ClassOption {
  id: string;
  name: string;
  section: string;
  displayName: string;
}

interface StudentSummary {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  className: string;
  lastLogin: string | null;
  lastLoginTimestamp: string | null;
  totalLogins: number;
}

interface LoginEntry {
  index: number;
  loginDate: string;
  loginTime: string;
  loginTimestamp: string;
}

interface StudentDetail {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  className: string;
  totalLogins: number;
  history: LoginEntry[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const StudentLoginHistoryModule = () => {
  const { role } = useAuth();

  // State
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classError, setClassError] = useState('');
  const [studentError, setStudentError] = useState('');

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ── Load classes on mount ──────────────────────────────────────────────────

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoadingClasses(true);
      setClassError('');
      const res = await studentLoginHistoryService.getAccessibleClasses();
      if (res.success) {
        setClasses(res.data || []);
      } else {
        setClassError(res.message || 'Failed to load classes');
      }
    } catch (err: any) {
      setClassError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  // ── Load students when class changes ───────────────────────────────────────

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents(selectedClassId);
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchStudents = async (classId: string) => {
    try {
      setLoadingStudents(true);
      setStudentError('');
      const res = await studentLoginHistoryService.getClassLoginSummary(classId);
      if (res.success) {
        setStudents(res.data || []);
      } else {
        setStudentError(res.message || 'Failed to load student data');
      }
    } catch (err: any) {
      setStudentError(err.response?.data?.message || 'Failed to load student data');
    } finally {
      setLoadingStudents(false);
    }
  };

  // ── View individual student history ────────────────────────────────────────

  const handleViewHistory = async (studentId: string) => {
    try {
      setLoadingDetail(true);
      setDetailOpen(true);
      setDetailData(null);
      const res = await studentLoginHistoryService.getStudentLoginHistory(studentId);
      if (res.success) {
        setDetailData(res.data);
      } else {
        toast.error(res.message || 'Failed to load student history');
        setDetailOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load student history');
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Search filter ──────────────────────────────────────────────────────────

  const filteredStudents = students.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.studentName?.toLowerCase().includes(q) ||
      s.enrollmentNo?.toLowerCase().includes(q)
    );
  });

  // ── Selected class display name ────────────────────────────────────────────

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedClassLabel = selectedClassId === 'ALL'
    ? 'All Classes'
    : selectedClass
    ? selectedClass.displayName
    : 'Select a class...';

  // ── Download Excel ─────────────────────────────────────────────────────────

  const handleDownloadExcel = () => {
    try {
      if (filteredStudents.length === 0) {
        toast.error('No data to export');
        return;
      }

      const excelData = filteredStudents.map((s, i) => ({
        'S.No.': i + 1,
        'Student Name': s.studentName,
        'Enrollment No.': s.enrollmentNo,
        'Class': s.className,
        'Last Login': s.lastLogin || 'Never logged in',
        'Total Logins': s.totalLogins,
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const colWidths = Object.keys(excelData[0]).map((key) => ({
        wch: Math.max(key.length, 18),
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Login History');

      const className = selectedClassLabel
        .replace(/[^a-zA-Z0-9_\- ]/g, '')
        .replace(/\s+/g, '_');
      XLSX.writeFile(wb, `Student_Login_History_${className}.xlsx`);
    } catch (err) {
      toast.error('Failed to generate Excel file');
      console.error(err);
    }
  };

  // ── Print ──────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    window.print();
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500 print-wrapper-container">
      {/* Header - hidden on print */}
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Student Login History
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View student login activity and complete login history.
            </p>
          </div>

          {selectedClassId && students.length > 0 && (
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="gap-2 h-9"
                disabled={filteredStudents.length === 0}
              >
                <Printer size={16} /> Print
              </Button>
              <Button
                onClick={handleDownloadExcel}
                className="gap-2 h-9 bg-green-600 hover:bg-green-700 text-white"
                disabled={filteredStudents.length === 0}
              >
                <Download size={16} /> Download Excel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Print header - visible only on print */}
      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold mb-1">Student Login History</h1>
        <p className="text-sm text-gray-600">
          Class: {selectedClassLabel} | Generated:{' '}
          {new Date().toLocaleString()}
        </p>
      </div>

      {/* Class Filter - hidden on print */}
      <Card className="p-4 border border-border print:hidden overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 max-w-sm">
            <label className="text-sm font-semibold text-muted-foreground block mb-1.5">
              Select Class
            </label>
            {loadingClasses ? (
              <div className="flex items-center gap-2 h-10 px-3 bg-muted/50 rounded-md border border-border text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading classes...
              </div>
            ) : classError ? (
              <div className="flex items-center gap-2 h-10 px-3 bg-destructive/10 rounded-md border border-destructive/20 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {classError}
              </div>
            ) : (
              <CustomSelect
                value={selectedClassId}
                onValueChange={(val) => {
                  setSelectedClassId(val);
                  setSearchQuery('');
                }}
                options={[
                  { value: 'ALL', label: 'All Sections' },
                  ...classes.map((c) => ({
                    value: c.id,
                    label: c.displayName
                  }))
                ]}
              />
            )}
          </div>

          {selectedClassId && students.length > 0 && (
            <div className="flex-1 max-w-sm sm:mt-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search students..."
                  className="pl-8 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Content Area */}
      {!selectedClassId && !loadingClasses && (
        <Card className="p-12 border border-border print:hidden">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <Users className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-lg font-medium">Select a class to view student login history</p>
            <p className="text-sm mt-1">
              Choose a class from the dropdown above to see login activity.
            </p>
          </div>
        </Card>
      )}

      {selectedClassId && loadingStudents && (
        <Card className="p-12 border border-border">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading student login data...</p>
          </div>
        </Card>
      )}

      {selectedClassId && studentError && !loadingStudents && (
        <Card className="p-12 border border-border">
          <div className="flex flex-col items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8 mb-4" />
            <p className="font-medium">{studentError}</p>
          </div>
        </Card>
      )}

      {selectedClassId && !loadingStudents && !studentError && students.length === 0 && (
        <Card className="p-12 border border-border">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium">No students found in this class</p>
            <p className="text-sm mt-1">There are no active student enrollments for the selected class.</p>
          </div>
        </Card>
      )}

      {selectedClassId && !loadingStudents && !studentError && filteredStudents.length > 0 && (
        <Card className="border border-border overflow-hidden print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead className="bg-muted print:bg-gray-100 sticky top-0 z-10 text-xs uppercase text-muted-foreground print:text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold border-b">#</th>
                  <th className="px-4 py-3 text-left font-semibold border-b">Student</th>
                  <th className="px-4 py-3 text-left font-semibold border-b">Enrollment No.</th>
                  <th className="px-4 py-3 text-left font-semibold border-b">Class</th>
                  <th className="px-4 py-3 text-left font-semibold border-b">Last Login</th>
                  <th className="px-4 py-3 text-center font-semibold border-b">Total Logins</th>
                  <th className="px-4 py-3 text-center font-semibold border-b print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(() => {
                  let currentClassName = '';
                  return filteredStudents.map((s, i) => {
                    const showHeader = selectedClassId === 'ALL' && currentClassName !== s.className;
                    if (showHeader) currentClassName = s.className;
                    
                    return (
                      <React.Fragment key={`${s.studentId}-${s.className}`}>
                        {showHeader && (
                          <tr className="bg-muted/50 border-y border-border">
                            <td colSpan={6} className="px-4 py-2 text-sm font-bold text-foreground">
                              {s.className}
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-muted/30 bg-background transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {s.studentName}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {s.enrollmentNo}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {s.className}
                          </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {s.lastLogin ? (
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Clock size={14} className="text-primary" />
                          {s.lastLogin}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Never logged in</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold ${
                          s.totalLogins > 0
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {s.totalLogins}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleViewHistory(s.studentId)}
                        >
                          <Eye size={14} /> View History
                        </Button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })
              })()}
              </tbody>
            </table>
          </div>
          {filteredStudents.length > 0 && (
            <div className="px-4 py-3 border-t border-border bg-muted/30 text-xs text-muted-foreground print:hidden">
              Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
            </div>
          )}
        </Card>
      )}

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border rounded-2xl shadow-2xl">
          <DialogHeader className="p-5 border-b border-border bg-muted/30">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <History className="text-primary" size={20} />
              Complete Login History
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 max-h-[65vh] overflow-y-auto">
            {loadingDetail && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Loading history...</p>
              </div>
            )}

            {!loadingDetail && detailData && (
              <div className="space-y-5">
                {/* Student info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Student Name</span>
                    <span className="font-semibold text-foreground">{detailData.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Enrollment No.</span>
                    <span className="font-semibold text-foreground">{detailData.enrollmentNo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Class</span>
                    <span className="font-semibold text-foreground">{detailData.className}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-0.5">Total Logins</span>
                    <span className="font-semibold text-primary">{detailData.totalLogins}</span>
                  </div>
                </div>

                <hr className="border-border" />

                {/* History table */}
                {detailData.history.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No login history available.</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-semibold border-b">#</th>
                          <th className="px-4 py-2.5 text-left font-semibold border-b">Login Date</th>
                          <th className="px-4 py-2.5 text-left font-semibold border-b">Login Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detailData.history.map((entry) => (
                          <tr key={entry.index} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 text-muted-foreground">{entry.index}</td>
                            <td className="px-4 py-2.5 text-foreground font-medium">{entry.loginDate}</td>
                            <td className="px-4 py-2.5 text-foreground">{entry.loginTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentLoginHistoryModule;
