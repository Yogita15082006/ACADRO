import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { CustomSelect } from "@/components/ui/select";
import api from '../services/api';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Search, History, GraduationCap, Printer, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { ProfileModule } from './ProfileModule';

interface HistoryRecord {
  enrollmentId: string;
  studentId: string;
  enrollmentNo: string;
  studentName: string;
  batchYear: string;
  admissionYear: string;
  academicYearId: string;
  academicYear: string;
  classId: string;
  className: string;
  section: string;
  semesterId: string;
  semesterNumber: number;
  attendancePercentage: number | null;
  midTermMarks: number | null;
  sgpa: number | null;
  cgpa: number | null;
  status: string;
}

export const StudentAcademicHistoryModule = () => {
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Filter states
  const [academicYears, setAcademicYears] = useState<{ id: string, year: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string, label: string }[]>([]);
  const [semesters, setSemesters] = useState<{ id: string, semesterNumber: number }[]>([]);

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [viewingStudent, setViewingStudent] = useState<string | null>(null);
  const [individualHistory, setIndividualHistory] = useState<HistoryRecord[]>([]);
  const [individualLoading, setIndividualLoading] = useState(false);

  useEffect(() => {
    if (viewingStudent) {
      setIndividualLoading(true);
      api.get(`/v1/hod/academic-history/${viewingStudent}`)
        .then(res => setIndividualHistory(res.data || []))
        .catch(err => toast.error('Failed to load individual academic history'))
        .finally(() => setIndividualLoading(false));
    } else {
      setIndividualHistory([]);
    }
  }, [viewingStudent]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory();
    }, 400);
    return () => clearTimeout(timer);
  }, [selectedAcademicYear, selectedClass, selectedSemester, selectedStatus, search]);

  const fetchFilters = async () => {
    try {
      const [ayRes, classRes, semRes] = await Promise.all([
        api.get('/academic-years'),
        api.get('/v1/classes'),
        api.get('/semesters')
      ]);
      setAcademicYears(ayRes.data?.data || []);
      const rawClasses = classRes.data?.data || [];
      const classList = rawClasses.map((c: any) => ({
        id: c.id,
        label: c.label || (c.name ? (c.section && c.section !== c.name ? `${c.name} - ${c.section}` : c.name) : (c.section || 'Class'))
      }));
      setClasses(classList);
      setSemesters(semRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch filters", err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAcademicYear) params.append('academicYearId', selectedAcademicYear);
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedSemester) params.append('semesterId', selectedSemester);
      if (selectedStatus) params.append('status', selectedStatus);
      if (search) params.append('search', search);

      const response = await api.get(`/v1/hod/academic-history?${params.toString()}`);
      setHistoryData(response.data || []);
    } catch (err) {
      toast.error('Failed to load academic history');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (historyData.length === 0) {
      toast.error('No records to export');
      return;
    }
    toast.info('Generating Excel file...');
    try {
      const exportData = historyData.map((s, index) => ({
        'S.No.': index + 1,
        'Enrollment No': s.enrollmentNo || 'N/A',
        'Student Name': s.studentName,
        'Batch': s.batchYear || s.admissionYear || 'N/A',
        'Academic Year': s.academicYear,
        'Semester': `Semester ${s.semesterNumber}`,
        'Class': s.className + (s.section ? ` - ${s.section}` : ''),
        'Attendance %': s.attendancePercentage !== null ? s.attendancePercentage + '%' : 'N/A',
        'Mid Term Marks': s.midTermMarks !== null ? s.midTermMarks : 'N/A',
        'SGPA': s.sgpa !== null ? s.sgpa : 'N/A',
        'Status': s.status
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wscols = [
        { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }, { wch: 15 }
      ];
      ws['!cols'] = wscols;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Academic_History");
      XLSX.writeFile(wb, `Student_Academic_History_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel downloaded successfully');
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (viewingStudent) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => setViewingStudent(null)} className="gap-2">
            <ArrowLeft size={16} /> Back to History
          </Button>
          <h2 className="text-2xl font-bold">Student Full History</h2>
        </div>
        <Card className="mb-6 border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="text-primary" size={20} />
              Historical Semester Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto custom-scrollbar max-w-full">
              <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-[#F5F3FF] dark:bg-[#1A182F] border-b border-primary/10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Academic Year</th>
                    <th className="px-4 py-3 font-semibold">Semester</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold text-center">Attendance</th>
                    <th className="px-4 py-3 font-semibold text-center">Mid Term Marks</th>
                    <th className="px-4 py-3 font-semibold text-center">SGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 bg-card">
                  {individualLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        <RefreshCw className="animate-spin mx-auto mb-2 text-primary" size={20} />
                        <p>Loading historical breakdown...</p>
                      </td>
                    </tr>
                  ) : individualHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        <p>No completed semesters found.</p>
                      </td>
                    </tr>
                  ) : (
                    individualHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-primary/5 transition-colors">
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="font-medium">
                            {record.academicYear ? (record.academicYear.length <= 2 ? `Year ${record.academicYear}` : record.academicYear) : "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-medium">{record.semesterNumber ? `Sem ${record.semesterNumber}` : "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {record.className ? (
                            <>
                              {record.className} {record.section && <span className="opacity-75">- {record.section}</span>}
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.attendancePercentage !== null && record.attendancePercentage !== undefined ? (
                            <span className={`font-semibold ${record.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                              {record.attendancePercentage}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-muted-foreground italic text-xs bg-muted px-2 py-0.5 rounded">
                            {record.midTermMarks !== null && record.midTermMarks !== undefined ? record.midTermMarks : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.sgpa !== null && record.sgpa !== undefined ? (
                            <Badge variant="secondary" className="font-semibold">{record.sgpa}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <ProfileModule
          studentId={viewingStudent}
          onBack={() => setViewingStudent(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="text-primary" size={24} />
            Student Academic History
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View departmental academic history for current and passed-out students.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 text-green-600 border-green-500/30 hover:bg-green-50 w-full md:w-auto">
            <FileText size={14} /> Download Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 w-full md:w-auto">
            <Printer size={14} /> Print
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-sm print:hidden">
        <CardContent className="p-4 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Enrollment no or name..."
                  className="pl-9 bg-muted/40 border-border/50"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Academic Year</label>
              <CustomSelect
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                onValueChange={setSelectedAcademicYear}
                options={[
                  { value: '', label: 'All Years' },
                  ...academicYears.map(ay => ({
                    value: ay.id,
                    label: ay.year ? (ay.year.length <= 2 ? `Year ${ay.year}` : ay.year) : 'Year'
                  }))
                ]}
                placeholder="Select Year"
              >
                <option value="">All Years</option>
                {academicYears.map(ay => (
                  <option key={ay.id} value={ay.id}>
                    {ay.year ? (ay.year.length <= 2 ? `Year ${ay.year}` : ay.year) : 'Year'}
                  </option>
                ))}
              </CustomSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class</label>
              <CustomSelect
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                onValueChange={setSelectedClass}
                options={[
                  { value: '', label: 'All Classes' },
                  ...classes.map(c => ({ value: c.id, label: c.label }))
                ]}
                placeholder="Select Class"
              >
                <option value="">All Classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </CustomSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semester</label>
              <CustomSelect
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                onValueChange={setSelectedSemester}
                options={[
                  { value: '', label: 'All Semesters' },
                  ...semesters
                    .sort((a, b) => a.semesterNumber - b.semesterNumber)
                    .map(s => ({ value: s.id, label: `Semester ${s.semesterNumber}` }))
                ]}
                placeholder="Select Sem"
              >
                <option value="">All Semesters</option>
                {semesters
                  .sort((a, b) => a.semesterNumber - b.semesterNumber)
                  .map(s => (
                    <option key={s.id} value={s.id}>
                      {`Semester ${s.semesterNumber}`}
                    </option>
                  ))}
              </CustomSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
              <CustomSelect
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                onValueChange={setSelectedStatus}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Current Students', label: 'Current Students' },
                  { value: 'Passed Out', label: 'Passed Out' }
                ]}
                placeholder="Select Status"
              >
                <option value="">All Statuses</option>
                <option value="Current Students">Current Students</option>
                <option value="Passed Out">Passed Out</option>
              </CustomSelect>
            </div>

            <Button onClick={fetchHistory} className="w-full lg:w-auto" disabled={loading}>
              {loading ? <RefreshCw className="animate-spin" size={16} /> : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px] print:h-auto print:border-none print:shadow-none">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-[1180px]">
            <thead className="text-xs uppercase sticky top-0 z-20 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-sm print:bg-transparent print:text-black">
              <tr>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-left text-white border-b border-primary-foreground/15 w-16 min-w-[64px]">S.No.</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-left text-white border-b border-primary-foreground/15 min-w-[200px]">Student Info</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-left text-white border-b border-primary-foreground/15 w-32 min-w-[120px]">Academic Year</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-left text-white border-b border-primary-foreground/15 w-28 min-w-[100px]">Semester</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-left text-white border-b border-primary-foreground/15 min-w-[150px]">Class</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-center text-white border-b border-primary-foreground/15 w-28 min-w-[100px]">Attendance</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-center text-white border-b border-primary-foreground/15 w-36 min-w-[130px]">Mid Term Marks</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-center text-white border-b border-primary-foreground/15 w-24 min-w-[80px]">SGPA</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-center text-white border-b border-primary-foreground/15 w-24 min-w-[80px]">CGPA</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-left text-white border-b border-primary-foreground/15 w-36 min-w-[130px]">Status</th>
                <th className="sticky top-0 z-20 px-4 py-3.5 font-semibold text-right text-white border-b border-primary-foreground/15 w-28 min-w-[110px] print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground border-b border-border/50">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-primary" size={24} />
                    <p>Loading historical records...</p>
                  </td>
                </tr>
              ) : historyData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground border-b border-border/50">
                    <History className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No historical records found for the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                historyData.map((record, index) => (
                  <tr key={record.enrollmentId || record.studentId || index} className="hover:bg-accent/10 transition-colors cursor-pointer" onClick={() => setViewingStudent(record.studentId)}>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-muted-foreground">{index + 1}</td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50">
                      <div className="font-medium text-foreground whitespace-normal leading-snug">{record.studentName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">{record.enrollmentNo}</div>
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50">
                      {record.academicYear ? (
                        <Badge variant="outline" className="font-medium whitespace-nowrap">
                          {record.academicYear.length <= 2 ? `Year ${record.academicYear}` : record.academicYear}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 font-medium whitespace-nowrap">
                      {record.semesterNumber ? `Sem ${record.semesterNumber}` : "—"}
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-muted-foreground whitespace-normal">
                      {record.className ? (
                        <>
                          {record.className} {record.section && record.section !== record.className && <span className="opacity-75">- {record.section}</span>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-center whitespace-nowrap">
                      {record.attendancePercentage !== null && record.attendancePercentage !== undefined ? (
                        <span className={`font-semibold ${record.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.attendancePercentage}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-center whitespace-nowrap">
                      <span className="text-muted-foreground italic text-xs bg-muted px-2 py-0.5 rounded">
                        {record.midTermMarks !== null && record.midTermMarks !== undefined ? record.midTermMarks : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-center whitespace-nowrap">
                      {record.sgpa !== null && record.sgpa !== undefined ? (
                        <Badge variant="secondary" className="font-semibold">{record.sgpa}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-center whitespace-nowrap">
                      {record.cgpa !== null && record.cgpa !== undefined ? (
                        <Badge variant="secondary" className="font-semibold bg-primary/10 text-primary">{record.cgpa}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 whitespace-nowrap">
                      <Badge className={record.status === 'Passed Out' ? 'bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-none' : 'bg-green-100 text-green-800 hover:bg-green-100/80 border-none'}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 align-middle border-b border-border/50 text-right whitespace-nowrap print:hidden">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewingStudent(record.studentId); }} className="text-primary hover:text-primary hover:bg-primary/10">
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Print only styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: landscape; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .custom-scrollbar { overflow: visible !important; }
        }
      `}} />
    </div>
  );
};
