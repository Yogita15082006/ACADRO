import { useState, useEffect } from 'react';
import api from "../services/api";
import { examResultService } from '../services/examResultService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Calendar as CalendarIcon, FileText, CheckCircle, 
  Plus, Search, Upload, Eye, Edit, Trash2, 
  Award, BarChart3, 
  Users, AlertTriangle, ChevronRight, CalendarDays, DownloadCloud, 
  FileSpreadsheet, Save, X, FileIcon,
  RefreshCw, FileText as FileTextIcon, Sparkles, BrainCircuit, Printer, Target, LayoutGrid, FolderOpen, User, Clock, List
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Bar, Legend, PieChart, Pie, Cell, BarChart
} from 'recharts';
import { toast } from 'sonner';


const getPersistentData = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Error reading from localStorage", e);
  }
  return defaultValue;
};

const setPersistentData = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error writing to localStorage", e);
  }
};

export const ExaminationModule = () => {
  const { role, user } = useAuth();
  
  // Real States
  const [exams, setExams] = useState<any[]>([]);
    const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  
  

  const [timetables] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timetable'); // timetable, results, analytics, info
  
  useEffect(() => {
    if (activeTab === 'eligibility') {
      fetchSavedEligibilityList();
    }
  }, [activeTab, selectedExam]);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
    setIsLoadingData(true);
    try {
      const [examsRes, batchesRes] = await Promise.all([
        api.get('/examinations'),
        api.get('/v1/metadata/batches')
      ]);
      
      if (examsRes.data.success) setExams(examsRes.data.data);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
    } catch (error) {
      console.error("Error fetching examination initial data:", error);
      toast.error("Failed to load examination data");
    } finally {
      setIsLoadingData(false);
    }
  };
    fetchData();
  }, []);


  // Publish Notice State
  const [showPublishNoticeModal, setShowPublishNoticeModal] = useState(false);
  const [publishNoticeTitle, setPublishNoticeTitle] = useState('');
  const [publishNoticeCategory, setPublishNoticeCategory] = useState('');
  const [publishNoticePriority, setPublishNoticePriority] = useState('Low');
  const [publishNoticeDescription, setPublishNoticeDescription] = useState('');
  const [publishNoticeFile, setPublishNoticeFile] = useState<File | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('acronexus_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('acronexus_timetables', JSON.stringify(timetables));
  }, [timetables]);


  
  // Create Exam (Admin)
  const [createExamName, setCreateExamName] = useState('');
  const [createType, setCreateType] = useState('MID_TERM');
  const [customType, setCustomType] = useState('');
  const [createYear, setCreateYear] = useState('');
  const [createSemester, setCreateSemester] = useState('');
  const [createBatch, setCreateBatch] = useState('');
  const [createClasses, setCreateClasses] = useState<string[]>([]);
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createDescription, setCreateDescription] = useState('');

  // Cascading logic
  useEffect(() => {
    if (createBatch) {
      api.get(`/academic-years?batch=${createBatch}`)
        .then(res => {
          if (res.data.success) setAcademicYears(res.data.data);
        })
        .catch(err => console.error(err));
    } else {
      setAcademicYears([]);
      setCreateYear('');
    }
  }, [createBatch]);

  useEffect(() => {
    if (createBatch && createYear) {
      api.get(`/semesters?batch=${createBatch}&academicYearId=${createYear}`)
        .then(res => {
          if (res.data.success) setSemesters(res.data.data);
        })
        .catch(err => console.error(err));
    } else {
      setSemesters([]);
      setCreateSemester('');
    }
  }, [createBatch, createYear]);

  useEffect(() => {
    if (createBatch && createYear && createSemester) {
      api.get(`/v1/classes?batch=${createBatch}&academicYearId=${createYear}&semesterId=${createSemester}`)
        .then(res => {
          if (res.data.success) setAllClasses(res.data.data);
        })
        .catch(err => console.error(err));
    } else {
      setAllClasses([]);
      setCreateClasses([]);
    }
  }, [createBatch, createYear, createSemester]);

  const [createTimetableFile, setCreateTimetableFile] = useState<File | null>(null);
  
  // Results Management (Admin)
  const [selectedClass, setSelectedClass] = useState('');
  const [enteringMarksForStudent, setEnteringMarksForStudent] = useState<any>(null);
  const [savedResults, setSavedResults] = useState<any[]>([]);
  const [resultViewMode, setResultViewMode] = useState<'saved' | 'create' | 'view'>('saved');
  const [resultSaved, setResultSaved] = useState(false);
  
  // Result Management Upload State
  const [resultUploadMethod, setResultUploadMethod] = useState<'upload' | 'manual' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reading' | 'extracting' | 'completed' | 'error'>('idle');
  const [, setIsUploading] = useState(false);
  const [uploadedMarks, setUploadedMarks] = useState<any[]>([]);
  const [resultSearch, setResultSearch] = useState('');
  const [resultStatusFilter, setResultStatusFilter] = useState('All');
  
  const [isGeneratingAIFeedback, setIsGeneratingAIFeedback] = useState(false);
  const [aiFeedbackStep, setAiFeedbackStep] = useState<string>('');

  const loadSavedResults = async () => {
    if (!selectedExam) return;
    try {
      const res = await examResultService.getResultsByExamAndClass(selectedExam.id);
      if (res.success && res.data) {
        const groupedByClass = res.data.reduce((acc: any, r: any) => {
           const cName = r.className || 'Unknown Class';
           if (!acc[cName]) {
              acc[cName] = {
                 id: cName,
                 examId: selectedExam.id,
                 examName: selectedExam.name,
                 className: cName,
                 semester: selectedExam.semesterName,
                 studentCount: new Set(),
                 academicYear: selectedExam.academicYearName,
                 status: 'Completed',
                 generationDate: new Date().toLocaleDateString(),
                 studentMap: {} // Store mapped students here
              };
           }
           acc[cName].studentCount.add(r.studentId);
           
           if (!acc[cName].studentMap[r.studentId]) {
               acc[cName].studentMap[r.studentId] = {
                   id: r.studentId,
                   studentName: r.studentName,
                   enrollmentNumber: r.enrollmentNo,
                   className: cName,
                   status: r.isPublished ? 'Published' : 'Draft',
                   subjectMarks: []
               };
           }
           acc[cName].studentMap[r.studentId].subjectMarks.push({
               name: r.subjectName || 'Subject',
               subjectCode: r.subjectCode,
               max: r.maxMarks || 100,
               obtained: r.marksObtained || 0,
               isPublished: r.isPublished
           });

           return acc;
        }, {});
        
        const uiSaved = Object.values(groupedByClass).map((c: any) => {
           const mappedMarks = Object.values(c.studentMap).map((student: any) => {
               const totalMax = student.subjectMarks.reduce((sum: number, s: any) => sum + s.max, 0);
               const totalMarks = student.subjectMarks.reduce((sum: number, s: any) => sum + s.obtained, 0);
               const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
               let grade = 'F';
               if (percentage >= 90) grade = 'A+';
               else if (percentage >= 80) grade = 'A';
               else if (percentage >= 70) grade = 'B+';
               else if (percentage >= 60) grade = 'B';
               else if (percentage >= 50) grade = 'C';
               else if (percentage >= 40) grade = 'P';
               
               return { ...student, totalMarks, percentage, grade };
           });
           return {
               ...c,
               marks: mappedMarks,
               studentCount: c.studentCount.size
           };
        });
        setSavedResults(uiSaved);
        setSavedResults(uiSaved);
      }
    } catch (error) {
      console.error("Failed to load saved results", error);
    }
  };

  useEffect(() => {
    if (resultViewMode === 'saved') {
       loadSavedResults();
    }
  }, [selectedExam, resultViewMode]);

  const handleGenerateAIFeedback = async () => {
    if (uploadedMarks.length === 0 || !selectedExam || !selectedClass) return;
    setIsGeneratingAIFeedback(true);
    setAiFeedbackStep('Initializing AI & generating feedback...');
    try {
      const res = await examResultService.generateAIFeedback(selectedExam.id, selectedClass);
      if (res.success) {
         toast.success('AI feedback generated successfully for all students.');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate AI feedback.');
    } finally {
      setIsGeneratingAIFeedback(false);
      setAiFeedbackStep('');
    }
  };
  
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishAll = async () => {
    if (!selectedExam || !selectedClass) return;
    setIsPublishing(true);
    try {
      const res = await examResultService.publishResults(selectedExam.id, selectedClass);
      if (res.success) {
        const count = res.data || 0;
        toast.success(`${count} result${count === 1 ? '' : 's'} published successfully`);
        
        // Refresh the 'uploadedMarks' (Draft View) from the actual DB state
        const dbRes = await examResultService.getResultsByExamAndClass(selectedExam.id, selectedClass);
        if (dbRes.success && dbRes.data) {
             const grouped = dbRes.data.reduce((acc: any, row: any) => {
                 if (!acc[row.studentId]) {
                     acc[row.studentId] = {
                         id: row.studentId,
                         name: row.studentName || 'Student',
                         enrollmentNumber: row.enrollmentNo,
                         className: selectedClass,
                         status: row.isPublished ? 'Published' : 'Draft',
                         subjectMarks: []
                     };
                 }
                 acc[row.studentId].subjectMarks.push({
                     name: row.subjectName || 'Subject',
                     subjectCode: row.subjectCode,
                     max: row.maxMarks || 100,
                     obtained: row.marksObtained || 0,
                     isPublished: row.isPublished
                 });
                 return acc;
             }, {});
             
             const mappedMarks = Object.values(grouped).map((student: any) => {
                 const totalMax = student.subjectMarks.reduce((sum: number, s: any) => sum + s.max, 0);
                 const totalMarks = student.subjectMarks.reduce((sum: number, s: any) => sum + s.obtained, 0);
                 const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
                 let grade = 'F';
                 if (percentage >= 90) grade = 'A+';
                 else if (percentage >= 80) grade = 'A';
                 else if (percentage >= 70) grade = 'B+';
                 else if (percentage >= 60) grade = 'B';
                 else if (percentage >= 50) grade = 'C';
                 else if (percentage >= 40) grade = 'P';
                 
                 return {
                     ...student,
                     totalMarks,
                     percentage: Number(percentage.toFixed(2)),
                     grade
                 };
             });
             setUploadedMarks(mappedMarks);
        }
        
        // Refresh the global published results view
        await loadSavedResults();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to publish results.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishResult = async (studentId: string) => {
    if (!selectedExam) return;
    try {
      const res = await examResultService.publishResults(selectedExam.id, undefined, studentId);
      if (res.success) {
        toast.success('Student result published!');
        setUploadedMarks(prev => prev.map(m => m.id === studentId ? { ...m, status: 'Published' } : m));
        if (enteringMarksForStudent && enteringMarksForStudent.id === studentId) {
            setEnteringMarksForStudent(null);
        }
      }
    } catch (e) {
      toast.error('Failed to publish student result.');
    }
  };
  
  const handleOpenStudentResult = async (student: any) => {
      setEnteringMarksForStudent(student);
      try {
         if (selectedExam) {
             const aiFeedback = await examResultService.getAIFeedback(selectedExam.id, student.className || selectedClass);
             if (aiFeedback && aiFeedback.data) {
                 const studentFeedback = aiFeedback.data.find((f: any) => f.studentId === student.id || f.studentId === student.studentId);
                 if (studentFeedback) {
                     setEnteringMarksForStudent({
                         ...student,
                         overallFeedback: studentFeedback.overallPerformance,
                     });
                 }
             }
         }
      } catch (e) {
          console.error('Failed to load AI feedback', e);
      }
  };

  // Results (Student)
  const [viewingSubjectResult, setViewingSubjectResult] = useState<any>(null);
  const [viewingReportCard, setViewingReportCard] = useState(false);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentAiFeedback, setStudentAiFeedback] = useState<any>(null);
  const [isStudentResultsLoading, setIsStudentResultsLoading] = useState(false);

  useEffect(() => {
    if (viewingReportCard) {
      document.body.classList.add('printing-report-card');
    } else {
      document.body.classList.remove('printing-report-card');
    }
    return () => document.body.classList.remove('printing-report-card');
  }, [viewingReportCard]);

  useEffect(() => {
    const fetchStudentResults = async () => {
      if (!selectedExam || role !== 'student' || activeTab !== 'results') return;
      setIsStudentResultsLoading(true);
      try {
        const res = await examResultService.getResultsByExamAndClass(selectedExam.id);
        if (res.success && res.data) {
          setStudentResults(res.data);
        }
        
        const aiRes = await examResultService.getAIFeedback(selectedExam.id);
        if (aiRes.success && aiRes.data && aiRes.data.length > 0) {
          setStudentAiFeedback(aiRes.data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch student results:", err);
      } finally {
        setIsStudentResultsLoading(false);
      }
    };
    
    fetchStudentResults();
  }, [selectedExam, activeTab, role]);
  // Eligibility Generator (Admin)
  const [elgCriteria, setElgCriteria] = useState({ attendance: true, assignment: false, quiz: false, internalMarks: false, event: false });
  const [elgSettings, setElgSettings] = useState({ attendance: 75, assignment: 80, quiz: 40, internal: 40 });
  const [elgGeneratedList, setElgGeneratedList] = useState<any[] | null>(null);
  const [savedListId, setSavedListId] = useState<string | null>(null);
  const [elgInsights, setElgInsights] = useState<any>(null);
  const [elgFilter, setElgFilter] = useState({ search: '', status: 'All', sort: 'Alpha' });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationText, setSimulationText] = useState('');
  

  const [elgViewMode, setElgViewMode] = useState<'saved' | 'create' | 'view'>('saved');
  const [isEligibilitySaved, setIsEligibilitySaved] = useState(false);

  // Seating Arrangement (Admin)
  const [seatRooms, setSeatRooms] = useState<any[]>([]); 
  const [seatingConfig] = useState<any>({ maxPerBench: 2, avoidSameClass: true, fillStrategy: 'sequential' });
  const [isSimulatingSeating, setIsSimulatingSeating] = useState(false);
  const [seatingGenerated, setSeatingGenerated] = useState<any>(null);
  const [seatingSaved, setSeatingSaved] = useState(false);
  const [savedSeatingLists, setSavedSeatingLists] = useState<any[]>(() => getPersistentData('acronexus_seating', []));
  const [seatingViewMode, setSeatingViewMode] = useState<'saved' | 'create' | 'view'>('saved');
  


  useEffect(() => {
    setPersistentData('acronexus_seating', savedSeatingLists);
  }, [savedSeatingLists]);

  useEffect(() => {
    const fetchInvigilators = async () => {
      try {
        const res = await api.get('/users/invigilators');
        if (res.data.success) {
          setInvigilatorsList(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch invigilators", err);
      }
    };
    fetchInvigilators();
  }, []);

  // Room entry state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomBenches, setNewRoomBenches] = useState('');
  const [newRoomMaxPerBench, setNewRoomMaxPerBench] = useState('2');
  const [newRoomInvigilators, setNewRoomInvigilators] = useState<string[]>([]);
  const [invigilatorsList, setInvigilatorsList] = useState<any[]>([]);
  const [newRoomStartTime, setNewRoomStartTime] = useState('10:00 AM');
  const [newRoomEndTime, setNewRoomEndTime] = useState('12:00 PM');

  // Constants
  // Helper to get students for a class
  const [classStudents, setClassStudents] = useState<any[]>([]);

  useEffect(() => {
    if (selectedClass) {
      setIsLoadingData(true);
      api.get(`/v1/students?className=${encodeURIComponent(selectedClass)}&size=1000`)
        .then(res => {
          if (res.data.success && res.data.data && res.data.data.content) {
            const mappedStudents = res.data.data.content.map((s: any) => ({
                id: s.id,
                name: s.name || 'Unknown',
                enrollmentNumber: s.enrollmentNumber || 'Unknown',
                className: selectedClass,
                status: 'Pending',
                subjectMarks: [],
                totalMarks: '-',
                grade: '-'
            }));
            setClassStudents(mappedStudents);
          }
        })
        .catch(err => console.error("Failed to fetch class students", err))
        .finally(() => setIsLoadingData(false));
    } else {
      setClassStudents([]);
    }
  }, [selectedClass]);

  const openCreateForm = (exam: any = null) => {
    if (exam) {
      setEditingExamId(exam.id);
      setCreateExamName(exam.name);
      setCreateType(exam.type || 'MID_TERM');
      setCreateYear(exam.academicYearId);
      setCreateSemester(exam.semesterId);
      setCreateBatch(exam.batch || '');
      setCreateClasses(exam.classIds || []);
      setCreateStartDate(exam.startDate);
      setCreateEndDate(exam.endDate);
      setCreateDescription(exam.description || '');
      setCreateTimetableFile(null);
    } else {
      setEditingExamId(null);
      setCreateExamName('');
      setCreateType('MID_TERM');
      setCustomType('');
      setCreateYear('');
      setCreateSemester('');
      setCreateBatch('');
      setCreateClasses([]);
      setCreateStartDate('');
      setCreateEndDate('');
      setCreateDescription('');
      setCreateTimetableFile(null);
    }
    setIsCreatingExam(true);
  };

  const handleSaveExam = async () => {
    if (!createExamName || !createBatch || !createYear || !createSemester || createClasses.length === 0 || !createStartDate || !createEndDate) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (new Date(createEndDate) < new Date(createStartDate)) {
      toast.error("End Date cannot be before Start Date.");
      return;
    }
    
    // Prepare DTO
    const requestDto = {
      name: createExamName,
      type: createType,
        customType: createType === 'OTHER' ? customType : null,
      batch: createBatch,
      semesterId: createSemester,
      academicYearId: createYear,
      classIds: createClasses,
      description: createDescription,
      startDate: createStartDate,
      endDate: createEndDate,
      timetableFileId: null 
    };

    try {
      let response;
      if (editingExamId) {
        response = await api.put(`/examinations/${editingExamId}`, requestDto);
      } else {
        response = await api.post(`/examinations`, requestDto);
      }
      
      let examData = response.data.data;

      // If timetable file is provided, upload it
      if (createTimetableFile) {
        const formData = new FormData();
        formData.append('file', createTimetableFile);
        try {
          const uploadResponse = await api.post(`/examinations/${examData.id}/timetable`, formData);
          examData = uploadResponse.data.data;
        } catch (uploadError: any) {
          console.error("Timetable upload failed:", uploadError);
          toast.error("Examination saved, but timetable upload failed.");
        }
      }

      if (editingExamId) {
        setExams(exams.map(e => e.id === editingExamId ? examData : e));
        toast.success("Examination updated successfully!");
      } else {
        setExams([...exams, examData]);
        toast.success("Examination created successfully!");
      }
      
      setIsCreatingExam(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save examination");
    }
  };
  
  const handleDeleteExam = (id: string) => {
    setExamToDelete(id);
  };

  const confirmDeleteExam = async () => {
    if (examToDelete) {
      try {
        await api.delete(`/examinations/${examToDelete}`);
        setExams(exams.filter(e => e.id !== examToDelete));
        if (selectedExam?.id === examToDelete) {
          setSelectedExam(null);
        }
        setExamToDelete(null);
        toast.success("Examination deleted successfully");
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to delete examination");
      }
    }
  };

  // handle delete timetable removed

  const fetchNotices = async () => {
    if (!selectedExam) return;
    try {
      const response = await api.get(`/examination-notices/examination/${selectedExam.id}`);
      if (response.data.success) {
        setNotices(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  useEffect(() => {
    if (selectedExam && activeTab === 'info') {
      fetchNotices();
    }
  }, [selectedExam, activeTab]);

  const handleDeleteNotice = async (id: string) => {
    try {
      await api.delete(`/examination-notices/${id}`);
      toast.success("Notice deleted successfully");
      fetchNotices();
    } catch (error) {
      toast.error("Failed to delete notice");
    }
    setExamToDelete(null);
  };

  const handleViewAttachment = async (fileId: string) => {
    try {
      console.log("Fetching attachment", fileId);
      const response = await api.get(`/examination-notices/file/${fileId}`, {
        responseType: 'blob'
      });
      console.log("Got attachment response", response);
      
      const blob = response.data;
      const fileUrl = window.URL.createObjectURL(blob);
      window.open(fileUrl, '_blank');
    } catch (error: any) {
      console.error("View attachment error:", error);
      toast.error(`Failed to fetch attachment: ${error.message}`);
    }
  };
  
  const handleEditNotice = (notice: any) => {
    setEditingNoticeId(notice.id);
    setPublishNoticeTitle(notice.title);
    setPublishNoticeCategory(notice.category || '');
    setPublishNoticePriority(notice.priority || 'Low');
    setPublishNoticeDescription(notice.description);
    setPublishNoticeFile(null);
    setShowPublishNoticeModal(true);
  };

  const handleSaveNotice = async () => {
    if (!publishNoticeTitle || !publishNoticeCategory || !publishNoticeDescription) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    try {
      let attachmentFileId = null;
      if (publishNoticeFile) {
        const formData = new FormData();
        formData.append('file', publishNoticeFile);
        const uploadRes = await api.post('/examination-notices/upload', formData);
        if (uploadRes.data.success) {
          attachmentFileId = uploadRes.data.data;
        }
      } else if (editingNoticeId) {
          const existingNotice = notices.find(n => n.id === editingNoticeId);
          if (existingNotice) {
              attachmentFileId = existingNotice.attachmentFileId;
          }
      }

      const noticeData = {
        examinationId: selectedExam?.id,
        title: publishNoticeTitle,
        description: publishNoticeDescription,
        category: publishNoticeCategory,
        priority: publishNoticePriority,
        publishDate: new Date().toISOString().split('T')[0],
        attachmentFileId: attachmentFileId
      };

      if (editingNoticeId) {
        await api.put(`/examination-notices/${editingNoticeId}`, noticeData);
        toast.success("Notice updated successfully");
      } else {
        await api.post('/examination-notices', noticeData);
        toast.success("Notice published successfully");
      }
      
      setShowPublishNoticeModal(false);
      fetchNotices();
      
      // Reset fields
      setEditingNoticeId(null);
      setPublishNoticeTitle('');
      setPublishNoticeCategory('');
      setPublishNoticePriority('Low');
      setPublishNoticeDescription('');
      setPublishNoticeFile(null);
    } catch (error: any) {
      console.error("Publish notice error:", error.response?.data || error);
      toast.error(error.response?.data?.message || (editingNoticeId ? "Failed to update notice" : "Failed to publish notice"));
    }
  };

  // --- RENDER: PUBLISH NOTICE MODAL ---
  const renderPublishNoticeModal = () => (
    <AnimatePresence>
      {showPublishNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-4 border-b border-border bg-accent/30">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Plus size={18} className="text-primary"/> {editingNoticeId ? 'Edit Notice' : 'Publish Notice'}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => {
                setShowPublishNoticeModal(false);
                setEditingNoticeId(null);
                setPublishNoticeTitle('');
                setPublishNoticeCategory('');
                setPublishNoticePriority('Low');
                setPublishNoticeDescription('');
                setPublishNoticeFile(null);
              }} className="h-8 w-8">
                <X size={16} />
              </Button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={publishNoticeTitle}
                  onChange={(e) => setPublishNoticeTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Admit Card Guidelines"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Category <span className="text-rose-500">*</span></label>
                  <select 
                    value={publishNoticeCategory}
                    onChange={(e) => setPublishNoticeCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select Category</option>
                    <option value="General Information">General Information</option>
                    <option value="Admit Card Notice">Admit Card Notice</option>
                    <option value="Seating Arrangement">Seating Arrangement</option>
                    <option value="Result Declaration">Result Declaration</option>
                    <option value="Syllabus/Curriculum">Syllabus/Curriculum</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Priority</label>
                  <select 
                    value={publishNoticePriority}
                    onChange={(e) => setPublishNoticePriority(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Description <span className="text-rose-500">*</span></label>
                <textarea 
                  value={publishNoticeDescription}
                  onChange={(e) => setPublishNoticeDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter notice description and guidelines..."
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground">Attachment (Optional)</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/30 transition-colors relative">
                   <input 
                     type="file" 
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     onChange={(e) => setPublishNoticeFile(e.target.files?.[0] || null)}
                   />
                   <div className="pointer-events-none flex flex-col items-center justify-center">
                     {publishNoticeFile ? (
                       <>
                         <FileIcon size={24} className="text-primary mb-2" />
                         <p className="text-sm font-medium text-foreground">{publishNoticeFile.name}</p>
                         <p className="text-xs text-muted-foreground mt-1">Click to change file</p>
                       </>
                     ) : (
                       <>
                         <Upload size={24} className="text-muted-foreground mb-2" />
                         <p className="text-sm font-medium text-foreground">Click or drag file to upload</p>
                         <p className="text-xs text-muted-foreground mt-1">Supports any type of file (PDF, DOCX, XLSX, Images, ZIP, etc.)</p>
                       </>
                     )}
                   </div>
                </div>
              </div>
            </div>
            
            <div className="flex border-t border-border bg-accent/30 p-4 gap-3 mt-auto">
              <Button variant="outline" className="flex-1" onClick={() => setShowPublishNoticeModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSaveNotice}>{editingNoticeId ? 'Save Changes' : 'Publish Notice'}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // --- RENDER: DELETE CONFIRMATION MODAL ---
  const renderDeleteModal = () => (
    <AnimatePresence>
      {examToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Delete Examination?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this examination? This action cannot be undone and will remove all associated timetables and notices.
              </p>
            </div>
            <div className="flex border-t border-border bg-accent/30 p-4 gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setExamToDelete(null)}>Cancel</Button>
              <Button className="flex-1 bg-rose-600 text-white hover:bg-rose-700" onClick={confirmDeleteExam}>Delete</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // --- RENDER: EXAM LIST (BOTH ADMIN & STUDENT) ---
  const renderExamList = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">Examination Module</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Manage and view official examinations</p>
        </div>
        {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
          <div className="flex gap-2">
            <Button onClick={() => openCreateForm()} className="bg-primary text-primary-foreground gap-2">
              <Plus size={16} /> Create New Examination
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => (
          <div 
            key={exam.id} 
            onClick={() => { setSelectedExam(exam); setActiveTab('timetable'); }}
            className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Award size={24} />
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider", 
                  exam.status === 'Completed' || exam.status?.toUpperCase() === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : exam.status === 'UPCOMING' || exam.status?.toUpperCase() === 'UPCOMING' ? 'bg-blue-600 text-white shadow-sm' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                )}>
                  {exam.status}
                </span>
                {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:bg-blue-50" onClick={() => openCreateForm(exam)}>
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteExam(exam.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{exam.name}</h3>
            {exam.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{exam.description}</p>}
              <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground mb-4 flex-grow">
                  <p className="flex items-center gap-2 col-span-2"><CalendarIcon size={14} className="text-primary"/> {new Date(exam.startDate).toLocaleDateString()} to {new Date(exam.endDate).toLocaleDateString()}</p>
                  <p className="flex items-center gap-2"><GraduationCap size={14} className="text-primary"/> Batch: <span className="font-medium text-foreground">{exam.batch}</span></p>
                  <p className="flex items-center gap-2"><GraduationCap size={14} className="text-primary"/> Year: <span className="font-medium text-foreground">{exam.academicYearName}</span></p>
                  <p className="flex items-center gap-2"><GraduationCap size={14} className="text-primary"/> Sem: <span className="font-medium text-foreground">{exam.semesterName || exam.semester}</span></p>
                  <p className="flex items-center gap-2 col-span-2"><GraduationCap size={14} className="text-primary"/> Classes: <span className="font-medium text-foreground">{exam.classNames ? exam.classNames.join(', ') : exam.class}</span></p>
                {exam.createdByName && <p className="text-xs text-muted-foreground flex items-center gap-2 mt-2 pt-2 border-t border-border/50 col-span-2"><User size={12}/> Created By: {exam.createdByName}</p>}
                {exam.createdAt && <p className="text-xs text-muted-foreground flex items-center gap-2 col-span-2"><Clock size={12}/> Created Date: {new Date(exam.createdAt).toLocaleString()}</p>}
              </div>
            <div className="pt-4 border-t border-border flex justify-end">
              <span className="text-sm font-semibold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Open Examination <ChevronRight size={16} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  // --- RENDER: CREATE EXAM FORM (ADMIN) ---
  const renderCreateExamForm = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setIsCreatingExam(false)}><ChevronRight className="rotate-180" /></Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{editingExamId ? 'Edit Examination' : 'Create New Examination'}</h2>
          <p className="text-sm text-muted-foreground">Add Improvement, Backlog, Practical, or Surprise exams</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Examination Name *</label>
            <input type="text" className="w-full p-2 border border-border rounded-lg bg-background" placeholder="e.g. Mid Semester Examination" value={createExamName} onChange={e => setCreateExamName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Examination Type *</label>
            <select className="w-full p-2 border border-border rounded-lg bg-background" value={createType} onChange={e => setCreateType(e.target.value)}>
              <option value="MID_TERM">Mid Term</option>
              <option value="END_TERM">End Term</option>
              <option value="PRACTICAL">Practical</option>
              <option value="QUIZ">Quiz</option>
              <option value="OTHER">Other (Manual Entry)</option>
            </select>
          </div>
          {createType === 'OTHER' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Specify Custom Examination Type *</label>
              <input type="text" className="w-full p-2 border border-border rounded-lg bg-background" placeholder="e.g. Unit Test 1" value={customType} onChange={e => setCustomType(e.target.value)} />
            </div>
          )}
          <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Batch *</label>
              <select className="w-full p-2 border border-border rounded-lg bg-background" value={createBatch} onChange={e => { setCreateBatch(e.target.value); setCreateYear(''); }}>
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Year *</label>
            <select className="w-full p-2 border border-border rounded-lg bg-background" value={createYear} onChange={e => { setCreateYear(e.target.value); setCreateClasses([]); }}>
              <option value="">Select Year</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>{year.displayYear || year.year}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Semester *</label>
            <select className="w-full p-2 border border-border rounded-lg bg-background" value={createSemester} onChange={e => setCreateSemester(e.target.value)}>
              <option value="">Select Semester</option>
              {semesters.map(sem => (
                <option key={sem.id} value={sem.id}>Semester {sem.semesterNumber}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Target Classes *</label>
              {allClasses.length > 0 && (
                <button type="button" onClick={() => {
                  const filtered = allClasses;
                  if (createClasses.length === filtered.length) {
                    setCreateClasses([]);
                  } else {
                    setCreateClasses(filtered.map(c => c.id));
                  }
                }} className="text-xs font-semibold text-primary hover:underline">
                  {createClasses.length > 0 && createClasses.length === allClasses.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            {(!createYear && !createSemester) ? (
              <p className="text-sm text-muted-foreground italic p-3 bg-muted/30 rounded-lg border border-border">
                Select Batch, Academic Year and Semester to view available classes.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {allClasses.map(cls => (
                    <label 
                      key={cls.id} 
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium ${
                        createClasses.includes(cls.id) 
                          ? 'border-primary bg-primary/10 text-primary' 
                          : 'border-border bg-card hover:border-primary/30 text-foreground'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={createClasses.includes(cls.id)} 
                        onChange={() => {
                          setCreateClasses(prev => 
                            prev.includes(cls.id) ? prev.filter(c => c !== cls.id) : [...prev, cls.id]
                          );
                        }}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      {cls.section ? cls.section : cls.name}
                    </label>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date *</label>
            <input type="date" className="w-full p-2 border border-border rounded-lg bg-background" value={createStartDate} onChange={e => setCreateStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date *</label>
            <input type="date" className="w-full p-2 border border-border rounded-lg bg-background" value={createEndDate} onChange={e => setCreateEndDate(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea className="w-full p-2 border border-border rounded-lg bg-background h-24" placeholder="Enter details about this exam..." value={createDescription} onChange={e => setCreateDescription(e.target.value)}></textarea>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Timetable Upload (Optional)</label>
            {createTimetableFile ? (
              <div className="p-4 border border-border rounded-lg flex items-center justify-between bg-accent/30">
                <div className="flex items-center gap-3">
                  <FileIcon className="text-primary" size={24} />
                  <div>
                    <p className="text-sm font-bold text-foreground">{createTimetableFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(createTimetableFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer text-xs font-bold text-blue-500 hover:underline">
                    Replace
                    <input type="file" className="hidden" accept=".pdf,image/*,.doc,.docx" onChange={(e) => e.target.files && setCreateTimetableFile(e.target.files[0])} />
                  </label>
                  <button type="button" onClick={() => setCreateTimetableFile(null)} className="text-xs font-bold text-rose-500 hover:underline">Remove</button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                <Upload size={24} className="text-muted-foreground mb-2" />
                <p className="text-sm font-bold text-foreground">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, PNG, JPG, JPEG (Max 5MB)</p>
                <input type="file" className="hidden" accept=".pdf,image/*,.doc,.docx" onChange={(e) => e.target.files && setCreateTimetableFile(e.target.files[0])} />
              </label>
            )}
          </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border md:col-span-2">
          <Button variant="outline" onClick={() => setIsCreatingExam(false)}>Cancel</Button>
          <Button className="bg-primary text-white" onClick={handleSaveExam}>{editingExamId ? 'Save Changes' : 'Publish Examination'}</Button>
        </div>
      </div>
    </motion.div>
  );

  // --- RENDER: EXAM DETAILS WRAPPER ---
  const renderExamDetails = () => {
    const tabs = ['faculty', 'hod', 'coordinator', 'both'].includes(role) 
      ? [
          { id: 'timetable', label: 'Timetable', icon: <CalendarDays size={16} /> },
          { id: 'eligibility', label: 'Eligible Students', icon: <Users size={16} /> },
          { id: 'seating', label: 'Seating Arrangement', icon: <LayoutGrid size={16} /> },
          { id: 'results', label: 'Result Management', icon: <Award size={16} /> },
          { id: 'info', label: 'Examination Information', icon: <FileText size={16} /> }
        ]
      : [
          { id: 'timetable', label: 'Timetable', icon: <CalendarDays size={16} /> },
          { id: 'results', label: 'Results', icon: <Award size={16} /> },
          { id: 'info', label: 'Examination Information', icon: <FileText size={16} /> }
        ];

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedExam(null)}><ChevronRight className="rotate-180" /></Button>
          <div>
            <h2 className="text-2xl font-black text-foreground">{selectedExam.name}</h2>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap size={14}/> {selectedExam.batch} • Sem: {selectedExam.semesterName || selectedExam.semester} • {selectedExam.startDate}
            </p>
          </div>
        </div>

        <div className="border-b border-border overflow-x-auto hide-scrollbar mb-6">
          <div className="flex gap-6 min-w-max px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 text-sm font-bold capitalize transition-all relative flex items-center gap-2",
                  activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="examTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'timetable' && renderTimetable()}
            {activeTab === 'eligibility' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderEligibilityGenerator()}
            {activeTab === 'seating' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderSeatingGenerator()}
            {activeTab === 'results' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderResultManagement()}
            {activeTab === 'results' && role === 'student' && renderStudentResults()}
            {activeTab === 'analytics' && ['faculty', 'hod', 'coordinator', 'both'].includes(role) && renderResultAnalytics()}
            {activeTab === 'info' && renderExamInformation()}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  const handleDownloadTimetable = async (timetableId: string, fileName: string, viewOnly: boolean = false) => {
    if (!selectedExam || !selectedExam.id) return;
    try {
      const response = await api.get(`/examinations/${selectedExam.id}/timetable/${timetableId}`, {
        responseType: 'blob'
      });
      const contentType = (response.headers['content-type'] as string) || 'application/pdf';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      
      if (viewOnly) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || 'timetable.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to download timetable");
    }
  };
  
  const handleDeleteTimetable = async (timetableId: string) => {
      if (!selectedExam || !selectedExam.id) return;
      try {
          await api.delete(`/examinations/${selectedExam.id}/timetable/${timetableId}`);
          toast.success("Timetable deleted successfully");
          const updated = { ...selectedExam, timetables: selectedExam.timetables.filter((t: any) => t.id !== timetableId) };
          setSelectedExam(updated);
          setExams(exams.map(e => e.id === updated.id ? updated : e));
      } catch (err) {
          console.error(err);
          toast.error("Failed to delete timetable");
      }
  };

  // --- RENDER: TIMETABLE (ADMIN & STUDENT) ---
  const renderTimetable = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Uploaded Timetables</h3>
          <p className="text-sm text-muted-foreground">Official examination schedules</p>
        </div>
        {['faculty', 'hod', 'coordinator', 'both', 'admin'].includes(role) && (
          <div className="relative overflow-hidden inline-block">
            <Button className="gap-2 bg-primary">
              <Upload size={16}/> Upload Timetable
            </Button>
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept=".pdf,image/*,.doc,.docx"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !selectedExam) return;
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  const uploadResponse = await api.post(`/examinations/${selectedExam.id}/timetable`, formData);
                  const updatedExam = uploadResponse.data.data;
                  // Ensure timetables array exists
                  if (!updatedExam.timetables) updatedExam.timetables = [];
                  setSelectedExam(updatedExam);
                  setExams(exams.map(ex => ex.id === updatedExam.id ? updatedExam : ex));
                  toast.success("Timetable uploaded successfully");
                } catch (err) {
                  console.error("Upload error", err);
                  toast.error("Failed to upload timetable");
                } finally {
                  e.target.value = '';
                }
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedExam?.timetables && selectedExam.timetables.length > 0 ? (
          selectedExam.timetables.map((tt: any) => (
            <div key={tt.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] uppercase font-bold flex items-center">
                  <CheckCircle size={12} className="mr-1"/> Active
                </span>
              </div>
              
              <div className="mb-4">
                <h4 className="font-bold text-base truncate" title={tt.fileName}>{tt.fileName}</h4>
                <p className="text-xs text-muted-foreground mt-1">Uploaded by {tt.uploadedBy}</p>
                <p className="text-xs text-muted-foreground">{new Date(tt.uploadDate).toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Button variant="outline" className="w-full text-xs h-9" onClick={() => handleDownloadTimetable(tt.id, tt.fileName, true)}><Eye size={14} className="mr-1"/> View</Button>
                <Button variant="outline" className="w-full text-xs h-9" onClick={() => handleDownloadTimetable(tt.id, tt.fileName, false)}><DownloadCloud size={14} className="mr-1"/> Download</Button>
                {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
                  <Button variant="outline" className="w-full col-span-2 text-xs h-9 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={() => handleDeleteTimetable(tt.id)}>
                    <Trash2 size={14} className="mr-1"/> Delete</Button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl bg-accent/50">
            <CalendarDays className="mx-auto text-muted-foreground mb-4" size={48} opacity={0.5}/>
            <h4 className="font-bold text-lg mb-2">No Timetables Available</h4>
            <p className="text-muted-foreground">The timetable for this examination has not been uploaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- RENDER: RESULT MANAGEMENT (ADMIN) ---
  const handleFileUpload = async (file: File) => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('PDF uploads are currently unavailable for Result Bulk Uploads. Support for machine-generated PDFs will be added in a future release. Please upload an Excel (.xlsx/.xls) or CSV (.csv) file.');
      return;
    }

    setUploadedFile(file);
    setIsUploading(true);
    setUploadStatus('reading');
    
    try {
      setUploadStatus('extracting');
      const response = await examResultService.uploadResults(file, selectedExam?.id, selectedClass);
      
      if (response && response.processingStatus === 'COMPLETED' || response.processingStatus === 'PARTIAL_SUCCESS') {
         toast.success(`Upload processed. Inserted: ${response.successfullyInserted || 0}, Updated: ${response.updatedRecords || 0}`);
         if (response.failedRecords > 0) {
             toast.warning(`Failed records: ${response.failedRecords}`);
         }
      } else {
         toast.error(`Upload failed.`);
      }
      
      setUploadStatus('completed');
      setIsUploading(false);
      
      if (selectedExam && selectedClass) {
         const res = await examResultService.getResultsByExamAndClass(selectedExam.id, selectedClass);
         if (res.success && res.data) {
             const grouped = res.data.reduce((acc: any, row: any) => {
                 if (!acc[row.studentId]) {
                     acc[row.studentId] = {
                         id: row.studentId,
                         name: row.studentName || 'Student',
                         enrollmentNumber: row.enrollmentNo,
                         className: selectedClass,
                         status: row.isPublished ? 'Published' : 'Draft',
                         subjectMarks: []
                     };
                 }
                 acc[row.studentId].subjectMarks.push({
                     name: row.subjectName || 'Subject',
                     subjectCode: row.subjectCode,
                     max: row.maxMarks || 100,
                     obtained: row.marksObtained || 0,
                     isPublished: row.isPublished
                 });
                 return acc;
             }, {});
             
             const mappedMarks = Object.values(grouped).map((student: any) => {
                 const totalMax = student.subjectMarks.reduce((sum: number, s: any) => sum + s.max, 0);
                 const totalMarks = student.subjectMarks.reduce((sum: number, s: any) => sum + s.obtained, 0);
                 const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;
                 let grade = 'F';
                 if (percentage >= 90) grade = 'A+';
                 else if (percentage >= 80) grade = 'A';
                 else if (percentage >= 70) grade = 'B+';
                 else if (percentage >= 60) grade = 'B';
                 else if (percentage >= 50) grade = 'C';
                 else if (percentage >= 40) grade = 'D';
                 return { ...student, totalMarks, percentage, grade };
             });
             setUploadedMarks(mappedMarks);
         }
      }
      
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("API upload failed.");
      setUploadStatus('error');
      setIsUploading(false);
    }
  };

  const renderUploadSection = () => {
    if (uploadStatus === 'completed') return null;

    return (
      <div className="bg-card border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center">
        {uploadStatus === 'idle' && (
           <>
             <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
               <Upload size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">Upload Result File</h3>
             <p className="text-sm text-muted-foreground mb-6">Drag and drop your Excel (.xlsx, .xls) or CSV file here, or click to browse.</p>
             <div className="flex gap-4 items-center">
               <input id="result-upload-file" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => { if (e.target.files && e.target.files.length > 0) handleFileUpload(e.target.files[0]); }} />
               <Button onClick={() => document.getElementById('result-upload-file')?.click()} className="gap-2">
                 <FileSpreadsheet size={16} /> Browse Files
               </Button>
             </div>
           </>
        )}
        {(uploadStatus === 'reading' || uploadStatus === 'extracting') && (
           <div className="flex flex-col items-center space-y-4 w-full max-w-md">
             <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
               <BrainCircuit size={32} />
             </div>
             <h3 className="text-lg font-bold text-foreground">
               {uploadStatus === 'reading' ? 'Reading File...' : 'Extracting Student Records...'}
             </h3>
             <p className="text-sm text-muted-foreground">Our AI is processing the uploaded document</p>

             {uploadedFile && (
               <div className="w-full bg-background border border-border rounded-lg p-4 flex items-center justify-between text-left mt-4 shadow-sm">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-100 text-emerald-600 rounded-md">
                     <FileSpreadsheet size={24} />
                   </div>
                   <div>
                     <p className="font-semibold text-sm truncate max-w-[200px]">{uploadedFile.name}</p>
                     <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.name.endsWith('.csv') ? 'CSV Document' : 'Excel Spreadsheet'}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-semibold">Uploaded</p>
                   <p className="text-xs text-muted-foreground">Just now</p>
                 </div>
               </div>
             )}

             <div className="w-full bg-accent rounded-full h-2 overflow-hidden mt-6">
                <motion.div 
                  className="bg-blue-500 h-full"
                  initial={{ width: uploadStatus === 'reading' ? '0%' : '50%' }}
                  animate={{ width: uploadStatus === 'reading' ? '50%' : '100%' }}
                  transition={{ duration: 1.5 }}
                />
             </div>
           </div>
        )}
      </div>
    );
  };

  const renderResultsTable = () => {
    // Determine data source
    let dataSource = [...classStudents];
    
    if (uploadStatus === 'completed' && uploadedMarks.length > 0) {
       const merged = [...classStudents];
       uploadedMarks.forEach(uploaded => {
           const idx = merged.findIndex(s => s.enrollmentNumber === uploaded.enrollmentNumber);
           if (idx >= 0) {
               merged[idx] = { ...merged[idx], ...uploaded, status: uploaded.status || 'Draft' };
           } else {
               merged.push({ ...uploaded, status: uploaded.status || 'Draft' });
           }
       });
       dataSource = merged;
    } else if (resultViewMode === 'saved' && savedResults.length > 0) {
       const saved = savedResults.find(r => r.className === selectedClass);
       if (saved && saved.marks) {
           const merged = [...classStudents];
           saved.marks.forEach((m: any) => {
               const idx = merged.findIndex(s => s.enrollmentNumber === m.enrollmentNumber);
               if (idx >= 0) {
                   merged[idx] = { ...merged[idx], ...m, status: m.status || 'Published' };
               } else {
                   merged.push({ ...m, status: m.status || 'Published' });
               }
           });
           dataSource = merged;
       }
    }

    // Apply filters
    const filteredData = dataSource.filter(student => {
      const sName = student.name || student.studentName || 'Unknown';
      const sEnrollment = student.enrollmentNumber || student.enrollmentNo || 'Unknown';
      const matchesSearch = sName.toLowerCase().includes(resultSearch.toLowerCase()) || sEnrollment.toLowerCase().includes(resultSearch.toLowerCase());
      const matchesStatus = resultStatusFilter === 'All' ? true : student.status === resultStatusFilter;
      return matchesSearch && matchesStatus;
    });

    const isAllDraft = filteredData.length > 0 && filteredData.every(s => s.status === 'Draft');
    const isAllPublished = filteredData.length > 0 && filteredData.every(s => s.status === 'Published');

    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col space-y-4 p-4 mt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-grow sm:max-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search name or enrollment..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background"
                value={resultSearch}
                onChange={e => setResultSearch(e.target.value)}
              />
            </div>
            <select 
              className="py-2 px-3 text-sm border border-border rounded-lg bg-background"
              value={resultStatusFilter}
              onChange={e => setResultStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {!isAllPublished && filteredData.length > 0 && (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full md:w-auto"
                  onClick={handlePublishAll}
                  disabled={isPublishing}
                >
                  <CheckCircle size={16} /> {isPublishing ? 'Publishing...' : 'Publish All'}
                </Button>
            )}
            {isAllPublished && resultViewMode === 'create' && (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full md:w-auto"
                  disabled={resultSaved}
                  onClick={() => {
                    const newSavedResult = {
                      id: `res-${Date.now()}`,
                      examId: selectedExam.id,
                      examName: selectedExam.name,
                      className: selectedClass,
                      academicYear: selectedExam.academicYear,
                      semester: selectedExam.semester,
                      generationDate: new Date().toLocaleDateString(),
                      studentCount: uploadedMarks.length,
                      status: 'Published',
                      marks: [...uploadedMarks]
                    };
                    setSavedResults([...savedResults, newSavedResult]);
                    setResultSaved(true);
                    toast.success('Result saved successfully');
                    setTimeout(() => {
                      setResultViewMode('saved');
                      setUploadStatus('idle');
                      setUploadedMarks([]);
                      setResultUploadMethod(null);
                      setResultSaved(false);
                    }, 1500);
                  }}
                >
                  <Save size={16} /> {resultSaved ? 'Saved' : 'Save Result'}
                </Button>
            )}
            {uploadStatus === 'completed' && (
                <Button variant="outline" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 gap-2 w-full md:w-auto" onClick={() => {
                  setUploadStatus('idle');
                  setUploadedFile(null);
                  setUploadedMarks([]);
                  setResultUploadMethod('upload');
                  toast.success('Upload discarded');
                }}>
                  <Trash2 size={16} /> Discard Upload
                </Button>
            )}
          </div>
        </div>

        {uploadStatus === 'completed' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border">
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Total Extracted</p>
               <p className="text-xl font-black">{uploadedMarks.length}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Highest Score</p>
               <p className="text-xl font-black text-emerald-500">{uploadedMarks.length > 0 ? Math.max(...uploadedMarks.map(m => Number(m.totalMarks) || 0)) : 0}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Average Score</p>
               <p className="text-xl font-black text-blue-500">{uploadedMarks.length > 0 ? (uploadedMarks.reduce((acc, curr) => acc + (Number(curr.totalMarks) || 0), 0) / uploadedMarks.length).toFixed(1) : 0}</p>
             </div>
             <div className="text-center">
                 <p className="text-xs text-muted-foreground font-semibold uppercase">Status</p>
                 <p className={cn("text-xl font-black", uploadedMarks.length > 0 && uploadedMarks.every(m => m.status === 'Published') ? "text-emerald-500" : "text-amber-500")}>
                    {uploadedMarks.length > 0 && uploadedMarks.every(m => m.status === 'Published') ? 'Published' : 'Draft'}
                 </p>
             </div>
          </div>
        )}

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-accent/50 text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Enrollment No.</th>
                <th className="px-4 py-3 text-center">Total Marks</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map(student => (
                <tr key={student.id} className="hover:bg-accent/20">
                  <td className="px-4 py-3 font-bold text-foreground">{student.name || student.studentName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{student.enrollmentNumber || student.enrollmentNo || 'Unknown'}</td>
                  <td className="px-4 py-3 text-center font-bold">{student.totalMarks}</td>
                  <td className="px-4 py-3 text-center font-bold">
                    <span className={cn(
                      "px-2 py-1 rounded-md", 
                      student.grade === 'A+' || student.grade === 'A' ? "bg-emerald-100 text-emerald-700" :
                      student.grade === 'B+' || student.grade === 'B' ? "bg-blue-100 text-blue-700" :
                      student.grade === 'C' ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                    )}>
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      student.status === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                      student.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}>
                      {student.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenStudentResult(student)}>
                         <Edit size={14} className="text-blue-500" />
                       </Button>
                       {student.status === 'Draft' && (
                         <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handlePublishResult(student.id || student.studentId)}>
                           <CheckCircle size={14} className="text-emerald-500" />
                         </Button>
                       )}
                       {student.status === 'Draft' && (
                         <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-500">
                           <Trash2 size={14} />
                         </Button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderResultManagement = () => {
    const examClasses = selectedExam?.classNames || [];

    if (enteringMarksForStudent) return renderStudentResultEntry();

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div>
            <h3 className="font-bold">Result Management</h3>
            <p className="text-sm text-muted-foreground">Select a class to upload or manage results for {selectedExam?.name}</p>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <Button 
               variant={resultViewMode === 'saved' ? 'default' : 'outline'}
               onClick={() => {
                 setResultViewMode('saved');
                 setUploadStatus('idle');
                 setUploadedMarks([]);
                 setResultUploadMethod(null);
                 setResultSaved(false);
               }}
               className="gap-2"
            >
               <FolderOpen size={16}/> Saved Results
            </Button>
            <Button 
               variant={resultViewMode === 'create' ? 'default' : 'outline'}
               onClick={() => {
                 setResultViewMode('create');
                 setUploadStatus('idle');
                 setUploadedMarks([]);
                 setResultUploadMethod(null);
                 setResultSaved(false);
               }}
               className="gap-2"
            >
               <Plus size={16}/> Create Result
            </Button>
            {resultViewMode === 'view' && (
                <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700 pointer-events-none">
                  <Eye size={16}/> Viewing Saved Result
                </Button>
            )}
            <select 
              className="p-2 border border-border rounded-lg bg-background min-w-[200px]"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setResultUploadMethod(null);
                setUploadedFile(null);
                setUploadStatus('idle');
                if (resultViewMode === 'view') setResultViewMode('create');
              }}
            >
              <option value="">-- Select Class --</option>
              {examClasses.map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {resultViewMode === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedResults.filter(r => r.examId === selectedExam?.id).map(res => (
              <div key={res.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                     <CheckCircle size={12}/> {res.status}
                   </span>
                   <span className="text-xs text-muted-foreground font-medium">{res.generationDate}</span>
                 </div>
                 <h4 className="text-lg font-bold text-foreground mb-1">{res.examName}</h4>
                 <p className="text-sm font-medium text-primary mb-4">{res.className} • Sem: {res.semester}</p>
                 
                 <div className="flex justify-between items-center bg-accent/40 rounded-lg p-3 mb-6 mt-auto">
                   <div>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Students</p>
                     <p className="font-black">{res.studentCount}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Academic Year</p>
                     <p className="font-black">{res.academicYear}</p>
                   </div>
                 </div>
                 
                 <div className="flex gap-2">
                   <Button variant="outline" className="flex-1 gap-2" onClick={() => {
                     setSelectedClass(res.className);
                     setUploadedMarks(res.marks);
                     setUploadStatus('completed');
                     setResultUploadMethod('upload');
                     setResultViewMode('view');
                   }}>
                     <Eye size={16}/> View
                   </Button>
                   <Button variant="outline" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 gap-2 px-3" onClick={async () => {
                       try {
                         await examResultService.deleteResultsForClass(selectedExam.id, res.className);
                         setSavedResults(savedResults.filter(r => r.id !== res.id));
                         toast.success("Saved result and published data deleted successfully");
                       } catch (e: any) {
                         toast.error(e.response?.data?.message || "Failed to delete saved result");
                       }
                     }}>
                       <Trash2 size={16}/>
                   </Button>
                 </div>
              </div>
            ))}
            {savedResults.filter(r => r.examId === selectedExam?.id).length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-accent/20">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>No saved results for this examination yet.</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setResultViewMode('create')}>
                  <Plus size={16}/> Create Result
                </Button>
              </div>
            )}
          </div>
        )}

        {(resultViewMode === 'create' || resultViewMode === 'view') && (
           <>
              <div className="flex gap-4">
                  <Button 
                    className="flex-1 h-24 flex flex-col gap-2 border-2 transition-all hover:bg-accent/50" 
                    variant={resultUploadMethod === 'upload' ? 'default' : 'outline'}
                    disabled={!selectedClass || resultViewMode === 'view'}
                    onClick={() => setResultUploadMethod('upload')}
                  >
                    <FileSpreadsheet size={32} className={resultUploadMethod === 'upload' ? "text-primary-foreground" : "text-emerald-500"} />
                    <span className="font-semibold">Upload Results (Excel/CSV)</span>
                  </Button>
                  <Button 
                    className="flex-1 h-24 flex flex-col gap-2 border-2 transition-all hover:bg-accent/50" 
                    variant={isGeneratingAIFeedback ? 'default' : 'outline'}
                    disabled={uploadStatus !== 'completed' || isGeneratingAIFeedback || resultViewMode === 'view'}
                    onClick={handleGenerateAIFeedback}
                  >
                    {isGeneratingAIFeedback ? (
                      <>
                         <RefreshCw size={32} className="animate-spin text-primary-foreground" />
                         <span className="font-semibold">{aiFeedbackStep}</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={32} className={uploadStatus === 'completed' ? "text-purple-500" : "text-muted-foreground"} />
                        <span className="font-semibold">Generate AI Feedback</span>
                      </>
                    )}
                  </Button>
              </div>
      
              {selectedClass && resultUploadMethod === 'upload' && resultViewMode === 'create' && renderUploadSection()}
              {selectedClass && uploadStatus === 'completed' && renderResultsTable()}
           </>
        )}
      </div>
    );
  };

  const renderStudentResultEntry = () => {
    if (!enteringMarksForStudent) return null;

    const handleSubjectMarkChange = (subjectName: string, newObtained: number) => {
      const newSubjectMarks = enteringMarksForStudent.subjectMarks.map((sm: any) => 
        sm.name === subjectName ? { ...sm, obtained: newObtained } : sm
      );
      const totalMax = newSubjectMarks.reduce((sum: number, sm: any) => sum + sm.max, 0);
      const totalMarks = newSubjectMarks.reduce((sum: number, sm: any) => sum + (Number(sm.obtained) || 0), 0);
      const percentage = (totalMarks / totalMax) * 100;
      
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C';
      else if (percentage >= 40) grade = 'D';

      const updatedStudent = {
        ...enteringMarksForStudent,
        subjectMarks: newSubjectMarks,
        totalMarks,
        percentage,
        grade
      };
      
      setEnteringMarksForStudent(updatedStudent);
      setUploadedMarks(prev => prev.map(m => m.id === updatedStudent.id ? updatedStudent : m));
    };

    const handleSubjectRemarkChange = (subjectName: string, newRemark: string) => {
      const newSubjectMarks = enteringMarksForStudent.subjectMarks.map((sm: any) => 
        sm.name === subjectName ? { ...sm, remarks: newRemark } : sm
      );
      const updatedStudent = {
        ...enteringMarksForStudent,
        subjectMarks: newSubjectMarks
      };
      setEnteringMarksForStudent(updatedStudent);
      setUploadedMarks(prev => prev.map(m => m.id === updatedStudent.id ? updatedStudent : m));
    };

    return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setEnteringMarksForStudent(null)}><ChevronRight className="rotate-180" /></Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">Result Entry: {enteringMarksForStudent.name}</h2>
          <p className="text-sm text-muted-foreground">Enrollment: {enteringMarksForStudent.enrollmentNumber} • Class: {enteringMarksForStudent.className}</p>
        </div>
        
        <div className="ml-auto flex gap-6 mr-4 bg-accent/40 px-6 py-2 rounded-xl">
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total</p>
            <p className="font-black text-lg">{enteringMarksForStudent.totalMarks} / {enteringMarksForStudent.subjectMarks?.reduce((s: number, m: any) => s + m.max, 0) || 180}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Percentage</p>
            <p className="font-black text-lg text-blue-500">{enteringMarksForStudent.percentage?.toFixed(1) || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Grade</p>
            <p className="font-black text-lg text-emerald-500">{enteringMarksForStudent.grade}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 bg-accent/30 flex justify-between items-center border-b border-border">
          <h3 className="font-bold">Subject Marks</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-xs h-8"><Plus size={14}/> Add Subject</Button>
            <Button variant="outline" size="sm" className="gap-2 text-xs h-8"><Users size={14}/> Add Student</Button>
          </div>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-accent/50 text-muted-foreground text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Subject Code</th>
              <th className="px-6 py-4 w-1/3">Subject Name</th>
              <th className="px-6 py-4">Max Marks</th>
              <th className="px-6 py-4">Obtained Marks</th>
              <th className="px-6 py-4">Remarks (Optional)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(enteringMarksForStudent.subjectMarks || []).map((subject: any, idx: number) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-muted-foreground">{subject.subjectCode || 'N/A'}</td>
                <td className="px-6 py-4 font-bold">{subject.name}</td>
                <td className="px-6 py-4 font-bold text-muted-foreground">{subject.max}</td>
                <td className="px-6 py-4">
                  <input 
                    type="number" 
                    className="w-24 p-2 text-center border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50" 
                    placeholder={`0-${subject.max}`}
                    value={subject.obtained === 0 ? '' : subject.obtained}
                    onChange={(e) => handleSubjectMarkChange(subject.name, parseInt(e.target.value) || 0)}
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    className="w-full p-2 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50" 
                    placeholder="e.g. Excellent" 
                    value={subject.remarks || ''}
                    onChange={(e) => handleSubjectRemarkChange(subject.name, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t border-border bg-accent/10">
          <label className="text-sm font-bold block mb-2">Overall AI Feedback</label>
          <textarea
             className="w-full p-3 border border-border rounded-md bg-background focus:ring-2 focus:ring-primary/50 text-sm"
             rows={3}
             value={enteringMarksForStudent.overallFeedback || ''}
             onChange={(e) => {
               const updated = { ...enteringMarksForStudent, overallFeedback: e.target.value };
               setEnteringMarksForStudent(updated);
               setUploadedMarks(prev => prev.map(m => m.id === updated.id ? updated : m));
             }}
             placeholder="e.g. Needs significant improvement..."
          />
        </div>
        <div className="p-4 border-t border-border bg-accent/20 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEnteringMarksForStudent(null)}>Cancel</Button>
          <Button variant="secondary" className="gap-2" onClick={() => setEnteringMarksForStudent(null)}><Save size={16}/> Save Draft</Button>
          <Button className="bg-primary text-primary-foreground" onClick={() => {
            const updated = { ...enteringMarksForStudent, status: 'Published' };
            setEnteringMarksForStudent(null);
            setUploadedMarks(prev => prev.map(m => m.id === updated.id ? updated : m));
            toast.success('Result published successfully');
          }}>Publish Result</Button>
        </div>
      </div>
    </motion.div>
    );
  };

  // --- RENDER: RESULT ANALYTICS (ADMIN) ---
  const renderResultAnalytics = () => {
    const pieData = [{ name: 'Pass', value: 85, color: '#10B981' }, { name: 'Fail', value: 15, color: '#EF4444' }];
    const subjectData = [
      { name: 'Java', avg: 72, max: 98, min: 35 },
      { name: 'DBMS', avg: 68, max: 95, min: 20 },
      { name: 'OS', avg: 75, max: 92, min: 40 },
      { name: 'Network', avg: 81, max: 99, min: 45 },
    ];
    const marksDist = [
      { range: '0-33', count: 15 },
      { range: '33-50', count: 45 },
      { range: '50-75', count: 80 },
      { range: '75-90', count: 50 },
      { range: '90-100', count: 10 },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold">Performance Analytics</h3>
        
        {/* KPI Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Students', value: '200', color: 'text-blue-500' },
            { label: 'Results Published', value: '185', color: 'text-emerald-500' },
            { label: 'Pending Results', value: '15', color: 'text-amber-500' },
            { label: 'Class Average', value: '74.5%', color: 'text-purple-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center items-center text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</span>
              <span className={cn("text-2xl font-black", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* KPI Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Highest Marks', value: '99/100' },
            { label: 'Lowest Marks', value: '12/100' },
            { label: 'Highest Percentage', value: '96.4%' },
            { label: 'Lowest Percentage', value: '32.1%' },
          ].map((stat, i) => (
            <div key={i} className="bg-accent/30 border border-border rounded-xl p-4 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-semibold text-muted-foreground mb-1">{stat.label}</span>
              <span className="text-lg font-bold text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Subject-wise Performance</h4>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="avg" name="Average Marks" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="max" name="Highest Marks" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
            <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Pass vs Fail Percentage</h4>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, percent}) => percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : name}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
           <h4 className="font-bold text-sm uppercase tracking-wider mb-6">Marks Distribution</h4>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marksDist} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366F1" fill="#6366F1" fillOpacity={0.2} strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>
    );
  };

  // --- RENDER: EXAM INFORMATION (NOTICES) (ADMIN & STUDENT) ---
  const renderExamInformation = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold">Examination Notices & Circulars</h3>
          <p className="text-sm text-muted-foreground">Important guidelines and instructions</p>
        </div>
        {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
          <Button className="gap-2 bg-primary" onClick={() => setShowPublishNoticeModal(true)}>
            <Plus size={16}/> Publish Notice
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notices.map(notice => (
          <div key={notice.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                  notice.category === 'Admit Card Notice' ? 'bg-indigo-500 text-white' : 'bg-primary text-primary-foreground'
                )}>
                  {notice.category}
                </span>
              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded", 
                notice.priority === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
              )}>
                {notice.priority}
              </span>
            </div>
            <h4 className="text-xl font-bold text-foreground mb-2">{notice.title}</h4>
            <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">{notice.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium">Published: {notice.publishDate}</p>
              <div className="flex gap-2">
                {notice.attachmentFileId && (
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => handleViewAttachment(notice.attachmentFileId)}>
                    <Eye size={14}/> View Attachment
                  </Button>
                )}
                {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:bg-blue-50" onClick={() => handleEditNotice(notice)}><Edit size={14}/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteNotice(notice.id)}><Trash2 size={14}/></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-accent/20">
            <FileTextIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No notices published for this examination yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- RENDER: STUDENT RESULTS & REPORT CARD ---
  const renderStudentResults = () => {
    if (viewingSubjectResult) return renderStudentSubjectDetail();
    if (viewingReportCard) return renderStudentReportCard();

    if (isStudentResultsLoading) {
      return <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-primary" size={32} /></div>;
    }

    if (!studentResults || studentResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-accent/20 rounded-xl border border-border">
          <AlertTriangle size={48} className="text-muted-foreground mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Results Not Available</h3>
          <p className="text-muted-foreground max-w-md">Your results for this examination have not been published yet. Please check back later or contact your class coordinator.</p>
        </div>
      );
    }

    const mappedResults = studentResults.map(res => {
      const percentage = res.maxMarks > 0 ? Math.round((res.marksObtained / res.maxMarks) * 100) : 0;
      const isPass = percentage >= 40;
      
      let calcGrade = res.grade;
      if (!calcGrade) {
         if (percentage >= 90) calcGrade = 'A+';
         else if (percentage >= 80) calcGrade = 'A';
         else if (percentage >= 70) calcGrade = 'B+';
         else if (percentage >= 60) calcGrade = 'B';
         else if (percentage >= 50) calcGrade = 'C';
         else if (percentage >= 40) calcGrade = 'P';
         else calcGrade = 'F';
      }

      return {
        id: res.id,
        code: res.subjectCode,
        name: res.subjectName,
        obtained: res.marksObtained,
        max: res.maxMarks,
        percentage,
        grade: calcGrade,
        status: isPass ? 'Pass' : 'Fail'
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-lg font-bold">Subject-wise Results</h3>
          <Button className="bg-primary text-primary-foreground gap-2" onClick={() => setViewingReportCard(true)}>
            <FileText size={16}/> View Overall Report Card
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedResults.map(res => (
            <div key={res.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm",
                  res.status === 'Pass' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                )}>
                  {res.status === 'Pass' ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                  {res.status}
                </span>
                <span className={cn("text-2xl font-black", res.status === 'Pass' ? 'text-emerald-500' : 'text-rose-500')}>{res.grade}</span>
              </div>
              
              <h4 className="text-lg font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{res.name}</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6 mt-auto">
                <div className="bg-accent/40 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Marks</p>
                  <p className="text-lg font-black">{res.obtained}<span className="text-xs font-medium text-muted-foreground">/{res.max}</span></p>
                </div>
                <div className="bg-accent/40 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Percentage</p>
                  <p className="text-lg font-black">{res.percentage}%</p>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2" onClick={() => setViewingSubjectResult(res)}>
                <Eye size={16}/> View Subject Result
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStudentSubjectDetail = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-2xl mx-auto">
      <Button variant="ghost" onClick={() => setViewingSubjectResult(null)} className="gap-2 -ml-4"><ChevronRight className="rotate-180"/> Back to Subjects</Button>
      
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center relative overflow-hidden">
        <div className={cn("absolute top-0 left-0 right-0 h-2", viewingSubjectResult.status === 'Pass' ? 'bg-emerald-500' : 'bg-rose-500')} />
        
        <h2 className="text-3xl font-black text-foreground mb-2 mt-4">{viewingSubjectResult.name}</h2>
        <p className="text-muted-foreground font-medium mb-8">Subject Code: {viewingSubjectResult.code}</p>
        
        <div className="flex justify-center items-center gap-12 mb-8">
          <div className="text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Score</p>
            <p className="text-6xl font-black">{viewingSubjectResult.obtained}</p>
            <p className="text-sm font-bold text-muted-foreground mt-2">out of {viewingSubjectResult.max}</p>
          </div>
          <div className="w-px h-24 bg-border"></div>
          <div className="text-center">
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Grade</p>
             <p className={cn("text-6xl font-black", viewingSubjectResult.status === 'Pass' ? 'text-emerald-500' : 'text-rose-500')}>{viewingSubjectResult.grade}</p>
             <p className="text-sm font-bold text-muted-foreground mt-2">{viewingSubjectResult.percentage}%</p>
          </div>
        </div>

        {studentAiFeedback && (
          <div className="bg-accent/30 rounded-xl p-5 text-left border border-border mt-8">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Performance Feedback</h4>
            <div className="space-y-4">
              {studentAiFeedback.strengths && studentAiFeedback.strengths.length > 0 && (
                 <div>
                   <p className="font-semibold text-emerald-600 mb-1">Strengths:</p>
                   <ul className="list-disc list-inside text-sm text-foreground ml-2">
                     {studentAiFeedback.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                   </ul>
                 </div>
              )}
              {studentAiFeedback.areasOfImprovement && studentAiFeedback.areasOfImprovement.length > 0 && (
                 <div>
                   <p className="font-semibold text-rose-600 mb-1">Areas for Improvement:</p>
                   <ul className="list-disc list-inside text-sm text-foreground ml-2">
                     {studentAiFeedback.areasOfImprovement.map((s: string, i: number) => <li key={i}>{s}</li>)}
                   </ul>
                 </div>
              )}
              {studentAiFeedback.actionPlan && (
                 <div>
                   <p className="font-semibold text-indigo-600 mb-1">Action Plan:</p>
                   <p className="text-sm text-foreground">{studentAiFeedback.actionPlan}</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderStudentReportCard = () => {
    const totalObtained = studentResults.reduce((sum, res) => sum + (res.marksObtained || 0), 0);
    const totalMax = studentResults.reduce((sum, res) => sum + (res.maxMarks || 0), 0);
    const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : "0.0";
    const isOverallPass = studentResults.every(res => res.maxMarks > 0 && (res.marksObtained / res.maxMarks) * 100 >= 40);

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button variant="ghost" onClick={() => setViewingReportCard(false)} className="gap-2 -ml-4"><ChevronRight className="rotate-180"/> Back to Results</Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.print()}>
            <DownloadCloud size={16}/> Download PDF
          </Button>
        </div>

        {/* Official Report Card UI */}
        <div className="bg-white text-black p-12 rounded-xl shadow-2xl border border-slate-200 print-wrapper">
          <div className="text-center border-b-4 border-slate-900 pb-6 mb-8">
            <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-slate-900 mb-3">Acropolis Institute</h1>
            <p className="text-base font-bold text-slate-600 uppercase tracking-widest">Official Examination Report Card</p>
          </div>

          <div className="flex justify-between items-start mb-10 text-sm font-bold text-slate-800 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <div className="space-y-3">
              <p className="text-base"><span className="text-slate-500 uppercase tracking-wider text-xs mr-2">Student Name:</span> {studentResults.length > 0 ? studentResults[0].studentName : user?.name}</p>
              <p className="text-base"><span className="text-slate-500 uppercase tracking-wider text-xs mr-2">Enrollment No:</span> {studentResults.length > 0 ? studentResults[0].enrollmentNo : (user?.enrollmentNumber || 'N/A')}</p>
            </div>
            <div className="space-y-3 text-right">
              <p className="text-base"><span className="text-slate-500 uppercase tracking-wider text-xs mr-2">Examination:</span> {selectedExam?.name}</p>
              <p className="text-base"><span className="text-slate-500 uppercase tracking-wider text-xs mr-2">Issue Date:</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse border-2 border-slate-800 mb-10">
            <thead className="bg-slate-800 text-white uppercase tracking-wider text-xs">
              <tr>
                <th className="border border-slate-700 p-4 text-left font-bold">Subject Code</th>
                <th className="border border-slate-700 p-4 text-left font-bold w-2/5">Subject Name</th>
                <th className="border border-slate-700 p-4 text-center font-bold">Max Marks</th>
                <th className="border border-slate-700 p-4 text-center font-bold">Obtained</th>
                <th className="border border-slate-700 p-4 text-center font-bold">Grade</th>
              </tr>
            </thead>
            <tbody>
              {studentResults.map((sub, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="border border-slate-300 p-4 font-mono text-slate-600 font-semibold">{sub.subjectCode}</td>
                  <td className="border border-slate-300 p-4 font-bold text-slate-800">{sub.subjectName}</td>
                  <td className="border border-slate-300 p-4 text-center font-medium text-slate-500">{sub.maxMarks}</td>
                  <td className="border border-slate-300 p-4 text-center font-black text-slate-900">{sub.marksObtained}</td>
                  <td className="border border-slate-300 p-4 text-center font-bold text-emerald-600">
                    {sub.grade || (() => {
                        const pct = sub.maxMarks > 0 ? (sub.marksObtained / sub.maxMarks) * 100 : 0;
                        if (pct >= 90) return 'A+';
                        if (pct >= 80) return 'A';
                        if (pct >= 70) return 'B+';
                        if (pct >= 60) return 'B';
                        if (pct >= 50) return 'C';
                        if (pct >= 40) return 'P';
                        return 'F';
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-black border-t-2 border-slate-800 text-base">
              <tr>
                <td colSpan={3} className="border border-slate-300 p-4 text-right uppercase tracking-widest text-slate-600">Total Performance</td>
                <td className="border border-slate-300 p-4 text-center text-slate-900">{totalObtained} / {totalMax}</td>
                <td className="border border-slate-300 p-4 text-center text-emerald-600">{overallPercentage}%</td>
              </tr>
              <tr>
                <td colSpan={3} className="border border-slate-300 p-4 text-right uppercase tracking-widest text-slate-600">Overall Status</td>
                <td colSpan={2} className="border border-slate-300 p-4 text-center text-slate-900 tracking-wider">
                  <span className={isOverallPass ? "text-emerald-600" : "text-rose-600"}>{isOverallPass ? "PASS" : "FAIL"}</span>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="flex justify-between items-end pt-24 px-8">
            <div className="text-center w-48">
              <div className="w-full border-b-2 border-slate-400 mb-3"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Class Coordinator</p>
            </div>
            <div className="text-center w-48">
              <div className="w-full border-b-2 border-slate-400 mb-3"></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Controller of Exams</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const handleGenerateClick = () => {
    setIsSimulating(true);
    setSimulationText('Analyzing student attendance records...');
    
    setTimeout(() => setSimulationText('Evaluating assignment submissions...'), 1000);
    setTimeout(() => setSimulationText('Processing internal marks...'), 2000);
    setTimeout(() => setSimulationText('Finalizing AI Eligibility Matrix...'), 3000);
    setTimeout(() => {
      setIsSimulating(false);
      generateEligibilityList();
      setElgViewMode('view');
    }, 4000);
  };

  const generateEligibilityList = async () => {
    if (!selectedExam) return;
    try {
      const payload = {
        criteria: elgCriteria,
        settings: elgSettings
      };
      
      const response = await api.post(`/examinations/${selectedExam.id}/generate-eligibility`, payload);
      if (!response.data.success) throw new Error("Failed to generate metrics");
      
      const list = response.data.data.map((s: any) => ({
        ...s,
        attendance: s.overallAttendance || 0,
        assignment: s.assignmentPercentage || 0,
        quiz: s.quizPercentage || 0,
        internal: s.internalPercentage || 0,
        reason: s.reason || '-'
      }));
      
      let eligibleCount = 0;
      let failAttendance = 0;
      let failAssignment = 0;
      let failQuiz = 0;

      list.forEach((student: any) => {
        if (student.isEligible) eligibleCount++;
        else {
           if (student.reason.includes('Attendance')) failAttendance++;
           if (student.reason.includes('Assignment')) failAssignment++;
           if (student.reason.includes('Quiz')) failQuiz++;
        }
      });
      
      list.sort((a: any, b: any) => {
          const classA = a.className || '';
          const classB = b.className || '';
          if (classA < classB) return -1;
          if (classA > classB) return 1;
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
      });

      const insights = {
        total: list.length,
        eligible: eligibleCount,
        notEligible: list.length - eligibleCount,
        percentage: list.length > 0 ? Math.round((eligibleCount / list.length) * 100) : 0,
        failAttendance,
        failAssignment,
        failQuiz
      };

      setElgInsights(insights);
      setElgGeneratedList(list);
      setIsEligibilitySaved(false);
      setElgViewMode('view');
      toast.success("Eligibility list generated successfully. Please review and save.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate eligibility list");
    }
  };
  
  const fetchSavedEligibilityList = async () => {
    if (!selectedExam) return;
    setIsLoadingData(true);
    try {
      const response = await api.get(`/examinations/${selectedExam.id}/eligibility-list`);
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const data = response.data.data[0];
        setSavedListId(data.id);
        const students = data.students.map((s: any) => ({
           id: s.id,
           studentId: s.studentId,
           name: s.name,
           enrollmentNumber: s.enrollmentNumber,
           className: s.className,
           attendance: s.overallAttendance || 0,
           assignment: s.assignmentPercentage || 0,
           quiz: s.quizPercentage || 0,
           internal: s.internalPercentage || 0,
           isEligible: s.isEligible,
           reason: s.reason
        }));
        
        let eligible = 0;
        students.forEach((s: any) => { if (s.isEligible) eligible++; });
        
        setElgInsights({
          total: students.length,
          eligible: eligible,
          notEligible: students.length - eligible,
          percentage: students.length > 0 ? Math.round((eligible / students.length) * 100) : 0,
          failAttendance: 0, failAssignment: 0, failQuiz: 0
        });
        students.sort((a: any, b: any) => {
            const classA = a.className || '';
            const classB = b.className || '';
            if (classA < classB) return -1;
            if (classA > classB) return 1;
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
        setElgGeneratedList(students);
        
        setIsEligibilitySaved(true);
        setElgViewMode('saved');
      }
    } catch (err: any) {
      setIsEligibilitySaved(false);
      setElgGeneratedList(null);
      setElgViewMode('create');
      if (err.response && err.response.status !== 404) {
        console.error("Fetch eligibility failed", err);
      }
    } finally {
      setIsLoadingData(false);
    }
  };
  
  const saveEligibilityListToBackend = async () => {
    if (!selectedExam || !elgGeneratedList) return;
    try {
      const payload = {
        students: elgGeneratedList.map((s: any) => ({
          studentId: s.studentId || s.id,
          enrollmentNumber: s.enrollmentNumber || s.enrollmentNo,
          isEligible: s.isEligible,
          reason: s.reason || '',
          overallAttendance: s.overallAttendance || s.attendance || 0,
          assignmentPercentage: s.assignment || s.assignmentPercentage || 0,
          quizPercentage: s.quiz || s.quizPercentage || 0,
          internalPercentage: s.internal || s.internalPercentage || 0
        }))
      };
      await api.post(`/examinations/${selectedExam.id}/eligibility-list`, payload);
      
      toast.success("Eligibility list saved to database successfully!");
      setIsEligibilitySaved(true);
      fetchSavedEligibilityList();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save eligibility list");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteEligibilityList = async (listId?: string) => {
    if (!selectedExam) return;
    try {
      await api.delete(`/examinations/${selectedExam.id}/eligibility-list/${listId || savedListId}`);
      toast.success("Eligibility list deleted successfully");
      setIsEligibilitySaved(false);
      setElgGeneratedList(null);
      setElgViewMode('create');
    } catch(err) {
      console.error(err);
      toast.error("Failed to delete eligibility list");
    }
  };

  const renderEligibilityGenerator = () => {
    if (elgViewMode === 'saved') {
      if (isLoadingData) {
        return <div className="text-center p-8"><BrainCircuit className="animate-pulse mx-auto text-primary" size={32} /><p className="mt-4 text-muted-foreground">Loading Eligibility List...</p></div>;
      }
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                <FolderOpen className="text-primary"/> Eligibility Lists
              </h2>
              <p className="text-sm text-muted-foreground">Manage and generate student eligibility reports</p>
            </div>
            {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
              <Button className="bg-primary text-primary-foreground gap-2" onClick={() => { setElgViewMode('create'); setElgGeneratedList(null); }}>
                <Plus size={16}/> Create New List
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elgGeneratedList && isEligibilitySaved ? (
              <div className="group relative bg-card border border-border/60 hover:border-primary/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="bg-primary/5 border-b border-border/50 px-5 py-4 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedExam?.type || 'Mid Semester'}</span>
                      <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedExam?.academicYearName || 'All'} - {selectedExam?.semesterName || 'All'}</span>
                    </div>
                    <h4 className="font-extrabold text-foreground text-lg leading-tight line-clamp-1">{selectedExam?.name || 'Eligibility Report'}</h4>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Saved</span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-xs font-semibold text-emerald-600 mb-1">Eligible</div>
                      <div className="text-xl font-black text-foreground">{elgInsights?.eligible || 0}</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 border border-border">
                      <div className="text-xs font-semibold text-rose-500 mb-1">Not Eligible</div>
                      <div className="text-xl font-black text-foreground">{elgInsights?.notEligible || 0}</div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-border/50">
                    <Button variant="outline" className="flex-1 min-w-[80px] text-sm font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary transition-colors" onClick={() => setElgViewMode('view')}>
                      <Eye size={16} className="mr-1.5"/> View
                    </Button>
                    <Button variant="outline" className="flex-1 min-w-[80px] text-sm font-semibold rounded-lg" onClick={handlePrint}>
                      <Printer size={16} className="mr-1.5"/> Print
                    </Button>
                    {['faculty', 'hod', 'coordinator', 'both'].includes(role) && (
                      <Button variant="outline" className="w-full text-sm font-semibold rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={() => handleDeleteEligibilityList()}>
                        <Trash2 size={16} className="mr-1.5"/> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl bg-accent/50">
                <BrainCircuit className="mx-auto text-muted-foreground mb-4" size={48} opacity={0.5}/>
                <h4 className="font-bold text-lg mb-2">No Eligibility List Available</h4>
                <p className="text-muted-foreground">An eligibility list for this examination has not been generated yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (elgViewMode === 'view' && elgGeneratedList) {
      let filtered = elgGeneratedList.filter(s => {
        if (elgFilter.status === 'Eligible' && !s.isEligible) return false;
        if (elgFilter.status === 'Not Eligible' && s.isEligible) return false;
        if (elgFilter.search && !s.name.toLowerCase().includes(elgFilter.search.toLowerCase()) && !s.enrollmentNumber.toLowerCase().includes(elgFilter.search.toLowerCase())) return false;
        return true;
      });

      if (elgFilter.sort === 'Alpha') {
        filtered.sort((a, b) => {
          const classCmp = (a.className || '').localeCompare(b.className || '');
          if (classCmp !== 0) return classCmp;
          return (a.name || '').localeCompare(b.name || '');
        });
      }
      if (elgFilter.sort === 'Enrollment') filtered.sort((a, b) => a.enrollmentNumber.localeCompare(b.enrollmentNumber));
      if (elgFilter.sort === 'Attendance') filtered.sort((a, b) => b.attendance - a.attendance);

      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setElgViewMode(isEligibilitySaved ? 'saved' : 'create')} className="gap-2 font-semibold">
                  <ChevronRight className="rotate-180" size={16}/> Back to List
                </Button>
                <div>
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                    <Sparkles className="text-primary"/> Eligibility Analysis Report
                  </h2>
                  <p className="text-sm text-muted-foreground">Class: {selectedExam?.class} • Sem: {selectedExam?.semester} • Exam: {selectedExam?.name}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                
                  {!isEligibilitySaved && (
                    <Button className="gap-2 flex-1 sm:flex-none bg-primary text-primary-foreground" onClick={saveEligibilityListToBackend}>
                      <CheckCircle size={16}/> Save List
                    </Button>
                  )}
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none bg-accent hover:bg-primary hover:text-primary-foreground" onClick={() => setElgViewMode('create')}><BrainCircuit size={16}/> Generate List</Button>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => setElgViewMode('saved')}><List size={16}/> Back to Saved Lists</Button>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={handlePrint}><Printer size={16}/> Print</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Students</p>
              <p className="text-3xl font-black text-blue-500">{elgInsights.total}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Eligible</p>
              <p className="text-3xl font-black text-emerald-500">{elgInsights.eligible}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Not Eligible</p>
              <p className="text-3xl font-black text-rose-500">{elgInsights.notEligible}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Eligibility %</p>
              <p className="text-3xl font-black text-purple-500">{elgInsights.percentage}%</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="p-4 border-b border-border bg-accent/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                  type="text" 
                  placeholder="Search student..." 
                  className="pl-9 pr-4 py-2 w-full text-sm border border-border rounded-lg bg-background"
                  value={elgFilter.search}
                  onChange={e => setElgFilter({...elgFilter, search: e.target.value})}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <select 
                  className="p-2 text-sm border border-border rounded-lg bg-background flex-1 sm:flex-none"
                  value={elgFilter.status}
                  onChange={e => setElgFilter({...elgFilter, status: e.target.value})}
                >
                  <option value="All">All Status</option>
                  <option value="Eligible">Eligible Only</option>
                  <option value="Not Eligible">Not Eligible Only</option>
                </select>
                <select 
                  className="p-2 text-sm border border-border rounded-lg bg-background flex-1 sm:flex-none"
                  value={elgFilter.sort}
                  onChange={e => setElgFilter({...elgFilter, sort: e.target.value})}
                >
                  <option value="Alpha">Sort: A-Z</option>
                  <option value="Enrollment">Sort: Enrollment No</option>
                  <option value="Attendance">Sort: Attendance</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap print:border-collapse print:border print:border-gray-400" style={{ pageBreakInside: 'auto' }}>
                <thead className="bg-accent/50 text-muted-foreground text-xs uppercase font-semibold print:bg-blue-50 print:text-blue-900">
                  <tr style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                    <th className="px-4 py-3">S.No.</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Enrollment Number</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3 text-center">Attendance %</th>
                    <th className="px-4 py-3 text-center">Assignment %</th>
                    <th className="px-4 py-3 text-center">Quiz %</th>
                    <th className="px-4 py-3 text-center">Eligibility Status</th>
                    <th className="px-4 py-3 text-center">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-accent/20 print:border-b print:border-gray-300" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                      <td className="px-4 py-3 font-medium text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3 font-bold">{s.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.enrollmentNumber}</td>
                      <td className="px-4 py-3">{s.className}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className={s.attendance < elgSettings.attendance && elgCriteria.attendance ? 'text-rose-500' : 'text-emerald-500'}>{s.attendance}%</span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className={s.assignment < elgSettings.assignment && elgCriteria.assignment ? 'text-rose-500' : 'text-emerald-500'}>{s.assignment}%</span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className={s.quiz < elgSettings.quiz && elgCriteria.quiz ? 'text-rose-500' : 'text-emerald-500'}>{s.quiz}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 w-max mx-auto shadow-sm",
                          s.isEligible ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                        )}>
                          {s.isEligible ? <CheckCircle size={12}/> : <X size={12}/>}
                          {s.isEligible ? 'Eligible' : 'Not Eligible'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-rose-500">
                        {!s.isEligible ? s.reason : '-'}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No students found matching filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      );
    }

    // Input Form UI (elgViewMode === 'create')
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Sparkles className="text-primary"/> Generate Eligible Student List
            </h2>
            <p className="text-sm text-muted-foreground">Automatically fetch metrics and generate list</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8 space-y-8">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {isSimulating ? (
              <div className="space-y-6">
                <div className="relative w-24 h-24 flex items-center justify-center mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <BrainCircuit className="text-primary animate-pulse" size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Generating List...</h3>
                  <p className="text-muted-foreground font-medium">Fetching attendance and assignments...</p>
                </div>
              </div>
            ) : (
                <div className="w-full text-left">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Configure Criteria</h3>
                  </div>
                  <hr className="border-border mb-6" />

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      
                      {/* Attendance */}
                      <div className={cn("border rounded-xl p-4 transition-all", elgCriteria.attendance ? 'border-primary bg-primary/5' : 'border-border bg-background')}>
                        <label className="flex items-start gap-3 cursor-pointer mb-3">
                          <input type="checkbox" className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" checked={elgCriteria.attendance} onChange={e => setElgCriteria({...elgCriteria, attendance: e.target.checked})} />
                          <div>
                            <span className="font-bold text-foreground">Attendance</span>
                            <p className="text-xs text-muted-foreground mt-0.5">Filter based on overall class attendance.</p>
                          </div>
                        </label>
                        {elgCriteria.attendance && (
                          <div className="ml-7 mt-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Minimum Attendance Required (%)</label>
                            <input type="number" className="w-full p-2 text-sm border border-border rounded-lg bg-background" value={elgSettings.attendance} onChange={e => setElgSettings({...elgSettings, attendance: Number(e.target.value)})} />
                          </div>
                        )}
                      </div>

                      {/* Assignment */}
                      <div className={cn("border rounded-xl p-4 transition-all", elgCriteria.assignment ? 'border-primary bg-primary/5' : 'border-border bg-background')}>
                        <label className="flex items-start gap-3 cursor-pointer mb-3">
                          <input type="checkbox" className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" checked={elgCriteria.assignment} onChange={e => setElgCriteria({...elgCriteria, assignment: e.target.checked})} />
                          <div>
                            <span className="font-bold text-foreground">Assignment Submission</span>
                            <p className="text-xs text-muted-foreground mt-0.5">Filter based on submitted assignments.</p>
                          </div>
                        </label>
                        {elgCriteria.assignment && (
                          <div className="ml-7 mt-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Minimum Submission Rate (%)</label>
                            <input type="number" className="w-full p-2 text-sm border border-border rounded-lg bg-background" value={elgSettings.assignment} onChange={e => setElgSettings({...elgSettings, assignment: Number(e.target.value)})} />
                          </div>
                        )}
                      </div>

                      {/* Quiz */}
                      <div className={cn("border rounded-xl p-4 transition-all", elgCriteria.quiz ? 'border-primary bg-primary/5' : 'border-border bg-background')}>
                        <label className="flex items-start gap-3 cursor-pointer mb-3">
                          <input type="checkbox" className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" checked={elgCriteria.quiz} onChange={e => setElgCriteria({...elgCriteria, quiz: e.target.checked})} />
                          <div>
                            <span className="font-bold text-foreground">Quiz Performance</span>
                            <p className="text-xs text-muted-foreground mt-0.5">Filter based on average quiz scores.</p>
                          </div>
                        </label>
                        {elgCriteria.quiz && (
                          <div className="ml-7 mt-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Minimum Average Quiz Marks (%)</label>
                            <input type="number" className="w-full p-2 text-sm border border-border rounded-lg bg-background" value={elgSettings.quiz} onChange={e => setElgSettings({...elgSettings, quiz: Number(e.target.value)})} />
                          </div>
                        )}
                      </div>

                      {/* Internal Marks */}
                      <div className={cn("border rounded-xl p-4 transition-all", elgCriteria.internalMarks ? 'border-primary bg-primary/5' : 'border-border bg-background')}>
                        <label className="flex items-start gap-3 cursor-pointer mb-3">
                          <input type="checkbox" className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary" checked={elgCriteria.internalMarks} onChange={e => setElgCriteria({...elgCriteria, internalMarks: e.target.checked})} />
                          <div>
                            <span className="font-bold text-foreground">Previous Internal Marks</span>
                            <p className="text-xs text-muted-foreground mt-0.5">Filter based on internal evaluations.</p>
                          </div>
                        </label>
                        {elgCriteria.internalMarks && (
                          <div className="ml-7 mt-2">
                            <label className="text-xs font-semibold text-muted-foreground block mb-1">Minimum Internal Percentage (%)</label>
                            <input type="number" className="w-full p-2 text-sm border border-border rounded-lg bg-background" value={elgSettings.internal} onChange={e => setElgSettings({...elgSettings, internal: Number(e.target.value)})} />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border flex justify-end">
                    <Button 
                      size="lg" 
                      className="bg-primary text-primary-foreground gap-2 font-bold w-full sm:w-auto shadow-lg hover:shadow-xl transition-all"
                      disabled={(!elgCriteria.attendance && !elgCriteria.assignment && !elgCriteria.quiz && !elgCriteria.internalMarks)}
                      onClick={generateEligibilityList}
                    >
                      <BrainCircuit size={18} className="animate-pulse"/> Generate Eligibility List
                    </Button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const handleAddRoom = () => {
    if (!newRoomName || !newRoomBenches) return;
    const benches = parseInt(newRoomBenches);
    const maxPerBench = parseInt(newRoomMaxPerBench) || 2;
    setSeatRooms([...seatRooms, { 
      id: Date.now().toString(), 
      name: newRoomName, 
      number: newRoomName, 
      benches: benches, 
      capacity: benches * maxPerBench,
      maxPerBench: maxPerBench,
      invigilatorIds: newRoomInvigilators,
      invigilatorNames: newRoomInvigilators.map(id => {
        const invig = invigilatorsList.find(i => i.id === id);
        return invig ? `${invig.firstName} ${invig.lastName || ''}`.trim() : '';
      }),
      startTime: newRoomStartTime,
      endTime: newRoomEndTime
    }]);
    setNewRoomName('');
    setNewRoomBenches('');
    setNewRoomInvigilators([]);
  };



  const handleGenerateSeatingClick = () => {
    const totalCapacity = seatRooms.reduce((acc, r) => acc + (r.benches * (r.maxPerBench || seatingConfig.maxPerBench)), 0);
    // 1. Fetch Eligibility List if not loaded
    let studentsForSeating = elgGeneratedList;
    if (!studentsForSeating || studentsForSeating.length === 0) {
      toast.error("No saved eligibility list found! Please generate and save an eligibility list first.");
      return;
    }
    
    const eligibleStudents = studentsForSeating.filter((s:any) => s.isEligible);
    
    if (eligibleStudents.length === 0) {
      toast.error("No eligible students found in the list!");
      return;
    }
    
    const totalStudents = eligibleStudents.length;
    
    if (totalCapacity < totalStudents) {
       setSeatingGenerated({
          totalStudents,
          roomsUtilized: seatRooms.length,
          totalCapacity,
          unallocatedStudents: totalStudents - totalCapacity,
          roomAllocations: []
       });
       setSeatingViewMode('view');
       return;
    }
    
    // Basic allocation logic based on eligible students
    let studentIndex = 0;
    const roomAllocations = seatRooms.map((r) => {
       const capacity = r.benches * (r.maxPerBench || seatingConfig.maxPerBench);
       const studentsInRoom: any[] = [];
       
       let rNum = 1;
       let bNum = 1;
       let sNum = 0; // 0=LEFT, 1=RIGHT
       
       for (let i = 0; i < capacity && studentIndex < eligibleStudents.length; i++) {
           const st = eligibleStudents[studentIndex++];
           studentsInRoom.push({
              ...st,
              rowNum: `R${rNum}`,
              benchNum: `B${bNum}`,
              seatPosition: sNum === 0 ? 'LEFT' : 'RIGHT'
           });
           
           sNum++;
           if (sNum > 1) {
               sNum = 0;
               bNum++;
               if (bNum > (r.maxPerBench || seatingConfig.maxPerBench)) { // Assuming basic layout
                   rNum++;
               }
           }
       }
       
       return {
          id: r.id,
          name: r.name,
          number: r.number,
          benches: r.benches,
          maxPerBench: r.maxPerBench,
          allocated: studentsInRoom.length,
          startTime: r.startTime,
          endTime: r.endTime,
          invigilatorNames: r.invigilatorNames,
          students: studentsInRoom
       };
    });
    
    setSeatingGenerated({
       totalStudents,
       roomsUtilized: seatRooms.length,
       totalCapacity,
       unallocatedStudents: 0,
       roomAllocations
    });
    setSeatingViewMode('view');
  };

  const renderSeatingGenerator = () => {
    if (seatingViewMode === 'saved') {
      return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                <FolderOpen className="text-primary"/> Saved Arrangements
              </h2>
              <p className="text-sm text-muted-foreground">Manage and generate examination seating plans</p>
            </div>
            <Button className="bg-primary text-primary-foreground gap-2" onClick={() => { setSeatingViewMode('create'); setSeatingGenerated(null); setSeatingSaved(false); setSeatRooms([]); }}>
              <Plus size={16}/> Create New Arrangement
            </Button>
          </div>

          {savedSeatingLists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedSeatingLists.map(list => (
                <div key={list.id} className="group relative bg-card border border-border/60 hover:border-primary/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                  <div className="bg-primary/5 border-b border-border/50 px-5 py-4 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{list.exam?.type || 'Mid Semester'}</span>
                        <span className="bg-secondary text-secondary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{list.exam?.academicYear || 'All'} - {list.exam?.semester || 'All'}</span>
                      </div>
                      <h4 className="font-extrabold text-foreground text-lg leading-tight line-clamp-1">{list.exam?.name || 'Seating Arrangement'}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border", "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}>Published</span>
                       <span className="text-xs text-muted-foreground font-medium flex items-center gap-1"><CalendarIcon size={12}/> {list.date}</span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-background rounded-lg p-3 border border-border">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Total Students</div>
                        <div className="text-xl font-black text-foreground">{list.list?.totalStudents || 0}</div>
                      </div>
                      <div className="bg-background rounded-lg p-3 border border-border">
                        <div className="text-xs font-semibold text-muted-foreground mb-1">Rooms Utilized</div>
                        <div className="text-xl font-black text-foreground">{list.list?.roomsUtilized || 0}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                      <Button variant="outline" className="flex-1 text-sm font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground border-primary/20 hover:border-primary transition-colors" onClick={() => {
                        setSeatingGenerated(list.list);
                        setSeatingSaved(true);
                        setSeatingViewMode('view');
                      }}>
                        <Eye size={16} className="mr-2"/> View
                      </Button>
                      <Button variant="outline" className="flex-1 text-sm font-semibold rounded-lg hover:bg-emerald-600 hover:text-white border-emerald-200 hover:border-emerald-600 transition-colors" onClick={() => {
                        setSeatingGenerated(list.list);
                        setSeatingSaved(true);
                        setSeatingViewMode('view');
                        setTimeout(() => window.print(), 100);
                      }}>
                        <Printer size={16} className="mr-2"/> Print
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400" onClick={() => {
                        setSavedSeatingLists((prev: any[]) => prev.filter(l => l.id !== list.id));
                      }}>
                        <Trash2 size={16}/>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-accent/10 mt-6">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <LayoutGrid size={24}/>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">No arrangements generated yet</p>
              <p className="text-xs text-muted-foreground">Create a new seating arrangement to get started</p>
            </div>
          )}
        </motion.div>
      );
    }

    if (seatingViewMode === 'view' && seatingGenerated) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto print:max-w-none print:m-0">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-seating-sheet, #printable-seating-sheet * {
                visibility: visible;
              }
              #printable-seating-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
              }
              .page-break {
                page-break-after: always;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
            }
          `}</style>
          
                      {seatingGenerated.unallocatedStudents > 0 && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 mb-4 print:hidden">
                <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-bold text-rose-700 text-sm">Insufficient Capacity</h4>
                  <p className="text-sm text-rose-600 mt-1">
                    <span className="font-bold">{seatingGenerated.unallocatedStudents}</span> eligible student(s) could not be allocated seats. 
                    Please add more rooms or increase capacity.
                  </p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4 mb-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSeatingViewMode('saved')} className="rounded-full bg-accent hover:bg-primary hover:text-primary-foreground">
                  <ChevronRight className="rotate-180" size={20}/>
                </Button>
                <div>
                  <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                    Official Seating Sheets
                  </h2>
                  <p className="text-sm text-muted-foreground">Ready for print. One page per room.</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {!seatingSaved && (
                  <Button className="gap-2 flex-1 sm:flex-none bg-primary text-primary-foreground" onClick={() => { 
                    setSeatingSaved(true); 
                    setSavedSeatingLists((prev: any[]) => [...prev, { id: Date.now(), exam: selectedExam, list: seatingGenerated, date: new Date().toLocaleDateString() }]);
                    toast.success("Seating Arrangement Saved successfully!"); 
                  }}>
                    <CheckCircle size={16}/> Save Seating
                  </Button>
                )}
                <Button variant="outline" className="gap-2 flex-1 sm:flex-none bg-accent hover:bg-primary hover:text-primary-foreground" onClick={() => setElgViewMode('create')}><BrainCircuit size={16}/> Generate List</Button>
                  <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={handlePrint}><Printer size={16}/> Print</Button>
              </div>
            </div>
          </div>

          <div id="printable-seating-sheet" className="bg-muted/10 print:bg-white rounded-xl">
            {seatingGenerated.roomAllocations.map((room: any, index: number) => {
              const studentList = room.students || [];
              return (
                <div key={room.id} className={cn("bg-white text-black p-8 sm:p-12 mb-8 border border-gray-200 shadow-sm rounded-xl print:border-none print:shadow-none print:p-0 print:mb-0 print:rounded-none", index < seatingGenerated.roomAllocations.length - 1 ? "page-break-after-always" : "")} style={{ pageBreakAfter: index < seatingGenerated.roomAllocations.length - 1 ? 'always' : 'auto' }}>
                  <div className="text-center border-b-2 border-black pb-6 mb-8">
                    <h1 className="text-2xl font-black uppercase tracking-wider mb-2">Acropolis Institute of Technology & Research</h1>
                    <h2 className="text-xl font-bold uppercase tracking-wide text-gray-800">Examination Seating Arrangement</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8 text-sm font-semibold">
                    <div className="flex"><span className="w-32 text-gray-600">Examination:</span> <span>{selectedExam?.name || 'Mid Semester Examination'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Room:</span> <span className="text-lg font-bold">{room.roomNumber || room.number}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Batch:</span> <span>{selectedExam?.batch || 'All Batches'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Academic Year:</span> <span>{selectedExam?.academicYearName || 'All Years'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Semester:</span> <span>{selectedExam?.semesterName || 'All Semesters'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Date:</span> <span>{selectedExam?.startDate || 'Scheduled Date'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Time:</span> <span>{room.startTime || '10:00 AM'} - {room.endTime || '12:00 PM'}</span></div>
                    <div className="flex"><span className="w-32 text-gray-600">Total Students:</span> <span>{room.allocated}</span></div>
                    {room.invigilatorNames && room.invigilatorNames.length > 0 && <div className="flex col-span-2"><span className="w-32 text-gray-600">Invigilator:</span> <span>{room.invigilatorNames.join(', ')}</span></div>}
                  </div>

                  <table className="w-full text-left border-collapse border border-gray-300 print:border-gray-500" style={{ pageBreakInside: 'auto' }}>
                    <thead>
                      <tr className="bg-gray-100 print:bg-gray-200" style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 w-16 text-center print:color-adjust-exact">S.No.</th>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 print:color-adjust-exact">Enrollment Number</th>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 print:color-adjust-exact">Student Name</th>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 text-center print:color-adjust-exact">Class</th>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 text-center print:color-adjust-exact">Row</th>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 text-center print:color-adjust-exact">Bench</th>
                        <th className="border border-gray-300 print:border-gray-500 px-4 py-3 font-bold text-gray-900 text-center print:color-adjust-exact">Seat</th>
                      </tr>
                    </thead>
                    <tbody style={{ pageBreakInside: 'auto' }}>
                      {studentList.map((student: any, i: number) => (
                        <tr key={student.id || i} className={i % 2 === 0 ? 'bg-white print:bg-white' : 'bg-gray-50 print:bg-gray-50'} style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 text-center text-gray-700 print:color-adjust-exact">{i + 1}</td>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 font-mono text-gray-800 print:color-adjust-exact">{student.enrollmentNumber || student.enrollment}</td>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 text-gray-800 font-medium print:color-adjust-exact">{student.studentName || student.name}</td>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 text-center text-gray-800 print:color-adjust-exact">{student.className}</td>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 text-center print:color-adjust-exact">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-xs print:border print:border-blue-300 print:color-adjust-exact">{student.rowNum || student.row}</span>
                          </td>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 text-center print:color-adjust-exact">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold text-xs print:border print:border-emerald-300 print:color-adjust-exact">{student.benchNum || student.bench}</span>
                          </td>
                          <td className="border border-gray-300 print:border-gray-500 px-4 py-2 text-center print:color-adjust-exact">
                            <span className={cn(
                              "px-2 py-1 rounded font-bold text-xs print:border print:color-adjust-exact",
                              (student.seatPosition || student.seat) === 'LEFT' ? "bg-purple-100 text-purple-800 print:border-purple-300" : 
                              (student.seatPosition || student.seat) === 'RIGHT' ? "bg-amber-100 text-amber-800 print:border-amber-300" : "bg-gray-200 text-gray-800 print:border-gray-300"
                            )}>
                              {student.seatPosition || student.seat}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="mt-12 flex justify-between px-8 text-sm font-bold text-gray-800 print:mt-16" style={{ pageBreakInside: 'avoid' }}>
                     <div className="text-center">
                       <div className="w-32 border-b border-gray-500 mb-2"></div>
                       {room.invigilatorNames && room.invigilatorNames.length > 0 ? `Invigilator (${room.invigilatorNames[0]})` : 'Invigilator Signature'}
                     </div>
                     <div className="text-center">
                       <div className="w-32 border-b border-gray-500 mb-2"></div>
                       Exam Controller
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
              <LayoutGrid className="text-primary"/> Generate Seating Arrangement
            </h2>
            <p className="text-sm text-muted-foreground">Create optimal examination seating plans</p>
          </div>
          <Button variant="outline" onClick={() => setSeatingViewMode('saved')} className="gap-2">
            <ChevronRight className="rotate-180"/> Back to Lists
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
            
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Manage Examination Rooms</label>
                <span className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{seatRooms.length} Rooms Added</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-accent/30 p-5 rounded-xl border border-border">
                <div className="space-y-1 lg:col-span-2">
                  <label className="text-xs font-semibold">Room Details</label>
                  <input type="text" placeholder="e.g. Lab 225 A, 101, Hall B" className="w-full p-2.5 text-sm border border-border rounded-lg bg-background" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Total Benches</label>
                  <input type="number" placeholder="e.g. 30" className="w-full p-2.5 text-sm border border-border rounded-lg bg-background" value={newRoomBenches} onChange={e => setNewRoomBenches(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Max Students Per Bench</label>
                  <input type="number" placeholder="e.g. 2" className="w-full p-2.5 text-sm border border-border rounded-lg bg-background" value={newRoomMaxPerBench} onChange={e => setNewRoomMaxPerBench(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Exam Start Time</label>
                  <input type="time" className="w-full p-2.5 text-sm border border-border rounded-lg bg-background" value={newRoomStartTime} onChange={e => setNewRoomStartTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Exam End Time</label>
                  <input type="time" className="w-full p-2.5 text-sm border border-border rounded-lg bg-background" value={newRoomEndTime} onChange={e => setNewRoomEndTime(e.target.value)} />
                </div>
                <div className="space-y-1 lg:col-span-2">
                    <label className="text-xs font-semibold">Invigilators (Select Multiple)</label>
                    <div className="w-full h-24 overflow-y-auto p-2 text-sm border border-border rounded-lg bg-background flex flex-col gap-1">
                      {invigilatorsList.length === 0 && <span className="text-muted-foreground text-xs p-1">Loading invigilators...</span>}
                      {invigilatorsList.map(invig => (
                        <label key={invig.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-accent rounded">
                          <input 
                            type="checkbox" 
                            checked={newRoomInvigilators.includes(invig.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewRoomInvigilators([...newRoomInvigilators, invig.id]);
                              } else {
                                setNewRoomInvigilators(newRoomInvigilators.filter(id => id !== invig.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span>{invig.firstName} {invig.lastName || ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                <div className="flex items-end lg:col-span-1">
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={handleAddRoom} disabled={!newRoomName || !newRoomBenches}>
                    <Plus size={16} className="mr-2"/> Add Room
                  </Button>
                </div>
              </div>

              {seatRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {seatRooms.map(room => (
                    <div key={room.id} className="bg-background border border-border rounded-xl p-4 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-extrabold text-sm text-foreground">{room.name} <span className="text-muted-foreground font-semibold">({room.number})</span></p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">{room.benches} Benches × {room.maxPerBench} / bench</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:bg-rose-50 -mt-1 -mr-1" onClick={() => setSeatRooms(seatRooms.filter(r => r.id !== room.id))}>
                          <Trash2 size={14}/>
                        </Button>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {room.invigilatorNames && room.invigilatorNames.length > 0 && (
                          <div className="flex items-center text-muted-foreground"><User size={12} className="mr-1.5 opacity-70"/> {room.invigilatorNames.join(', ')}</div>
                        )}
                        <div className="flex items-center text-muted-foreground"><Clock size={12} className="mr-1.5 opacity-70"/> {room.startTime} - {room.endTime}</div>
                        <div className="flex items-center text-muted-foreground"><Users size={12} className="mr-1.5 opacity-70"/> {room.capacity} Total Capacity</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-12 border border-dashed border-border rounded-xl bg-accent/10 mt-6">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <LayoutGrid size={24}/>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">No rooms added yet</p>
                  <p className="text-xs text-muted-foreground">Add rooms above to generate seating arrangement</p>
                </div>
              )}
              
                <div className="flex justify-end pt-6 border-t border-border mt-8">
                  <Button 
                    size="lg"
                    className="bg-primary text-primary-foreground gap-2 font-bold px-8 shadow-md shadow-primary/20" 
                    disabled={seatRooms.length === 0}
                    onClick={handleGenerateSeatingClick}
                  >
                    <BrainCircuit size={18} className="animate-pulse"/> Generate Plan
                  </Button>
                </div>
              </div>
        </motion.div>
      );
    };



  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 lg:pb-8 print:p-0 print:m-0 print:max-w-none">
      {isCreatingExam && ['faculty', 'hod', 'coordinator', 'both'].includes(role) ? (
        renderCreateExamForm()
      ) : selectedExam ? (
        renderExamDetails()
      ) : (
        renderExamList()
      )}
      {renderDeleteModal()}
      {renderPublishNoticeModal()}

    </div>
  );
};

export default ExaminationModule;
