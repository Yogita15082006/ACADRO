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
  RefreshCw, FileText as FileTextIcon, Sparkles, BrainCircuit, Printer, Target, LayoutGrid, FolderOpen, User, Clock, List,
  Loader2, CheckSquare, Check, Download
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

export const ExamResultWorkspace = ({ mode, workspaceContext, examinationId, examinationName, targetSections }: any) => {
  const { role, user } = useAuth();
  
  // Capabilities State
  const [examCapabilities, setExamCapabilities] = useState<{
    canCreateExamination: boolean;
    canAssignExamCoordinator: boolean;
    activeCoordinatorAssignments: any[];
  } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [departmentAssignments, setDepartmentAssignments] = useState<any[]>([]);
  const [eligibleFaculty, setEligibleFaculty] = useState<any[]>([]);
  
  // Assign Coordinator Form States
  const [assignFacultyId, setAssignFacultyId] = useState('');
  const [assignExamPurpose, setAssignExamPurpose] = useState('');
  const [assignValidUntil, setAssignValidUntil] = useState('');
  const [isAssigningCoordinator, setIsAssigningCoordinator] = useState(false);

  // Real States
  const [exams, setExams] = useState<any[]>([]);
  const [subjectCardExamId, setSubjectCardExamId] = useState<string>('');
  const [subjectCardSelectedExam, setSubjectCardSelectedExam] = useState<any>(null);
  
  // Present Students separate state
  const [presentStudentsExamId, setPresentStudentsExamId] = useState<string>('');
  const [presentStudentsDate, setPresentStudentsDate] = useState<string>('');
  const [presentStudentsAvailableDates, setPresentStudentsAvailableDates] = useState<string[]>([]);

  const effectiveExaminationId = mode === 'subject_card' ? subjectCardExamId : examinationId;
  const effectiveExaminationName = mode === 'subject_card' ? subjectCardSelectedExam?.name : examinationName;

  const targetSectionsInternal = mode === 'subject_card' && workspaceContext 
      ? [{ id: workspaceContext.classId, name: workspaceContext.className }] 
      : (targetSections || []);
      
  const [selectedClassInternal, setSelectedClassInternal] = useState(
      mode === 'subject_card' && workspaceContext ? workspaceContext.classId : ''
  );
  
  const [resultContextSubjectId, setResultContextSubjectId] = useState<string>(mode === 'subject_card' && workspaceContext ? workspaceContext.id : '');
  const [sectionSubjects, setSectionSubjects] = useState<any[]>([]);
  const [availableExamDates, setAvailableExamDates] = useState<string[]>([]);
  const [resultContextSet, setResultContextSet] = useState<boolean>(mode === 'subject_card');

  useEffect(() => {
    if (selectedClassInternal && mode === 'examination') {
      api.get(`/v1/class-subjects/class/${selectedClassInternal}`).then((res: any) => {
        if (res.data) setSectionSubjects(Array.isArray(res.data) ? res.data : (res.data.data || []));
      }).catch((err: any) => console.error(err));
    }
  }, [selectedClassInternal, mode]);

  useEffect(() => {
    if (mode === 'subject_card' && effectiveExaminationId && workspaceContext) {
      api.get(`/examinations/${effectiveExaminationId}/attendance?subjectIds=${workspaceContext.id}`).then((res: any) => {
        if (res.data && res.data.success && res.data.data) {
          const dates = Array.from(new Set(res.data.data.map((a: any) => a.examDate)));
          setAvailableExamDates(dates as string[]);
        }
      }).catch((err: any) => console.error(err));
    }
  }, [mode, effectiveExaminationId, workspaceContext]);

  useEffect(() => {
    if (mode === 'subject_card' && presentStudentsExamId && workspaceContext) {
      api.get(`/examinations/${presentStudentsExamId}/attendance?subjectIds=${workspaceContext.id}`).then((res: any) => {
        if (res.data && res.data.success && res.data.data) {
          const dates = Array.from(new Set(res.data.data.map((a: any) => a.examDate)));
          setPresentStudentsAvailableDates(dates as string[]);
        }
      }).catch((err: any) => console.error(err));
    }
  }, [mode, presentStudentsExamId, workspaceContext]);

    const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [batches, setBatches] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  
  

  const [timetables] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const computedExam = exams.find((e: any) => e.id === (examinationId || (selectedExam ? selectedExam.id : null))) || null;
  const currentExam = mode === 'subject_card' ? subjectCardSelectedExam : (selectedExam || computedExam);
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
      const fetchPromises: any[] = [
        api.get('/examinations'),
        api.get('/v1/metadata/batches')
      ];

      if (['hod', 'coordinator', 'faculty'].includes(role)) {
        fetchPromises.push(api.get('/exam-coordinator-assignments/capabilities'));
      }

      if (role === 'hod') {
        fetchPromises.push(api.get('/exam-coordinator-assignments'));
        fetchPromises.push(api.get('/exam-coordinator-assignments/eligible-faculty'));
      }

      const results = await Promise.all(fetchPromises);
      const examsRes = results[0];
      const batchesRes = results[1];
      const capsRes = results.length > 2 && ['hod', 'coordinator', 'faculty'].includes(role) ? results[2] : null;
      const deptAssignmentsRes = role === 'hod' ? results[results.length - 2] : null;
      const facultyRes = role === 'hod' ? results[results.length - 1] : null;
      
      if (examsRes.data.success) setExams(examsRes.data.data);
      if (batchesRes.data.success) setBatches(batchesRes.data.data);
      if (capsRes && capsRes.data.success) setExamCapabilities(capsRes.data.data);
      if (deptAssignmentsRes && deptAssignmentsRes.data.success) setDepartmentAssignments(deptAssignmentsRes.data.data);
      if (facultyRes && facultyRes.data.success) setEligibleFaculty(facultyRes.data.data);
    } catch (error) {
      console.error("Error fetching examination initial data:", error);
      toast.error("Failed to load examination data");
    } finally {
      setIsLoadingData(false);
    }
  };
    fetchData();
  }, [role]);


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
  const [createTimetableFile, setCreateTimetableFile] = useState<File | null>(null);
  const [createCoordinatorAssignmentId, setCreateCoordinatorAssignmentId] = useState('');
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

  
  
  // Results Management (Admin)
  const [resultContextDate, setResultContextDate] = useState<string>('');
  const [enteringMarksForStudent, setEnteringMarksForStudent] = useState<any>(null);
  const [fullResultList, setFullResultList] = useState<any[]>([]);
  const [resultSaved, setResultSaved] = useState(false);
  const [savedResultContexts, setSavedResultContexts] = useState<any[]>([]);
  const [isSavedContextsLoading, setIsSavedContextsLoading] = useState(false);
  
  // Result Management Upload State
  const [resultUploadMethod, setResultUploadMethod] = useState<'upload' | 'manual' | null>(null);
  const [isCreatingResult, setIsCreatingResult] = useState(false);
  const [subjectCardViewMode, setSubjectCardViewMode] = useState<'IDLE' | 'SAVED_RESULTS' | 'CREATE_RESULT'>('IDLE');
  const [createResultFlowState, setCreateResultFlowState] = useState<'IDLE' | 'SELECT_EXAM' | 'SELECT_DATE' | 'UPLOAD_FILE' | 'RESULT_READY'>('IDLE');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'reading' | 'extracting' | 'completed' | 'error'>('idle');
  const [resultTargetClassId, setResultTargetClassId] = useState<string>('');
  const [presentTargetSubjectId, setPresentTargetSubjectId] = useState<string>('');
  const [presentSectionSubjects, setPresentSectionSubjects] = useState<any[]>([]);

  useEffect(() => {
    if (resultTargetClassId && mode === 'examination') {
      api.get(`/v1/class-subjects/class/${resultTargetClassId}`).then((res: any) => {
        if (res.data) setPresentSectionSubjects(Array.isArray(res.data) ? res.data : (res.data.data || []));
      }).catch((err: any) => console.error(err));
    } else {
      setPresentSectionSubjects([]);
    }
  }, [resultTargetClassId, mode]);

  const [presentStudentsForSection, setPresentStudentsForSection] = useState<any[] | null>(null);
  const [isPresentStudentsLoading, setIsPresentStudentsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [presentStudentsError, setPresentStudentsError] = useState<string | null>(null);
  const [, setIsUploading] = useState(false);
  const [uploadedMarks, setUploadedMarks] = useState<any[]>([]);
  const [resultSearch, setResultSearch] = useState('');
  const [resultStatusFilter, setResultStatusFilter] = useState('All');
  
  const [deleteResultContext, setDeleteResultContext] = useState<any>(null);
  const [isDeletingResult, setIsDeletingResult] = useState(false);

  const [isGeneratingAIFeedback, setIsGeneratingAIFeedback] = useState(false);
  const [aiFeedbackStep, setAiFeedbackStep] = useState<string>('');

    const fetchSavedContexts = async () => {
      if (!effectiveExaminationId) return;
      setIsSavedContextsLoading(true);
      try {
        const res = await examResultService.getSavedContexts(effectiveExaminationId);
        if (res && res.success) {
          setSavedResultContexts(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch saved contexts:", err);
      } finally {
        setIsSavedContextsLoading(false);
      }
    };

    useEffect(() => {
      if (subjectCardViewMode === 'SAVED_RESULTS' && !resultContextDate) {
        fetchSavedContexts();
      }
    }, [subjectCardViewMode, effectiveExaminationId, resultContextDate]);

  const fetchFullResultList = async (examId?: string, date?: string, subjectId?: string) => {
    const eId = examId || effectiveExaminationId;
    const ctxDate = date || resultContextDate;
    const ctxSub = subjectId || resultContextSubjectId;
    
    if (!eId || !ctxSub || !ctxDate) return [];
    setIsLoadingData(true);
    try {
      const res = await examResultService.getResultContext(eId, ctxDate, ctxSub);
      if (res.success && res.data) {
        setFullResultList(res.data);
        return res.data;
      } else {
        setFullResultList([]);
        return [];
      }
    } catch (err) {
      console.error("Failed to load result list", err);
      setFullResultList([]);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    // Only auto-fetch if we are in examination mode or SAVED_RESULTS mode
    if (mode === 'examination' || subjectCardViewMode === 'SAVED_RESULTS') {
      fetchFullResultList();
    }
  }, [effectiveExaminationId, resultContextDate, resultContextSubjectId, subjectCardViewMode, mode]);

  const handleGenerateAIFeedback = async () => {
    const hasEligibleMarks = fullResultList.some(s => s.marksObtained != null);
    if (!hasEligibleMarks || !currentExam || !selectedClassInternal) {
        toast.error("No marked results are available for AI feedback.");
        return;
    }

    const unsavedRows = fullResultList
        .filter(s => s.marksObtained != null)
        .map(s => ({
            studentId: s.studentId,
            resultId: s.id, // Might be undefined for unsaved, which is fine
            marksObtained: s.marksObtained,
            maxMarks: s.maxMarks
        }));

    setIsGeneratingAIFeedback(true);
    setAiFeedbackStep('Initializing AI & generating feedback...');
    try {
      const res = await examResultService.generateAIFeedback(
          effectiveExaminationId, 
          selectedClassInternal,
          resultContextDate,
          targetSubjectId,
          unsavedRows
      );
      if (res.success) {
         toast.success('AI feedback generated successfully for all students.');
         setStudentAiFeedback(res.data);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to generate AI feedback.');
    } finally {
      setIsGeneratingAIFeedback(false);
      setAiFeedbackStep('');
    }
  };
  
  const fetchPresentStudents = async (classId: string, subjectId?: string, date?: string) => {
    const targetExamId = mode === 'subject_card' ? presentStudentsExamId : effectiveExaminationId;
    if (!classId || !targetExamId) return;
    setIsPresentStudentsLoading(true);
    setPresentStudentsError(null);
    try {
      let endpoint = `/exam-results/examinations/${targetExamId}/present-students?classId=${classId}`;
      if (subjectId) endpoint += `&classSubjectId=${subjectId}`;
      if (date) endpoint += `&examDate=${date}`;
      const res = await api.get(endpoint);
      setPresentStudentsForSection(res.data.data);
    } catch (err: any) {
      setPresentStudentsError(err.response?.data?.message || "Failed to load present students");
      setPresentStudentsForSection(null);
    } finally {
      setIsPresentStudentsLoading(false);
    }
  };

  const effectivePresentTargetSubjectId = mode === 'subject_card' && workspaceContext ? workspaceContext.id : presentTargetSubjectId;
  const effectivePresentTargetClassId = mode === 'subject_card' && workspaceContext ? workspaceContext.classId : resultTargetClassId;

  useEffect(() => {
    if (effectivePresentTargetClassId && (mode === 'subject_card' || effectivePresentTargetSubjectId)) {
      const targetDate = mode === 'subject_card' ? presentStudentsDate : resultContextDate;
      fetchPresentStudents(effectivePresentTargetClassId, effectivePresentTargetSubjectId, targetDate);
    } else {
      setPresentStudentsForSection(null);
      setPresentStudentsError(null);
    }
  }, [effectivePresentTargetClassId, effectivePresentTargetSubjectId, mode, resultContextDate, presentStudentsExamId, presentStudentsDate]);

  const handleResultSectionChange = (classId: string) => {
    setResultTargetClassId(classId);
    setPresentTargetSubjectId('');
  };

  const targetSubjectId = resultContextSubjectId || (mode === 'subject_card' && workspaceContext ? workspaceContext.id : undefined);


  const handleDownloadPresentStudentsExcel = async () => {
    const targetExamId = mode === 'subject_card' ? presentStudentsExamId : effectiveExaminationId;
    if (!targetExamId || !effectivePresentTargetClassId) return;
    setIsExporting(true);
    try {
        let endpoint = `/exam-results/examinations/${targetExamId}/present-students/export?classId=${effectivePresentTargetClassId}`;
        if (effectivePresentTargetSubjectId) {
            endpoint += `&classSubjectId=${effectivePresentTargetSubjectId}`;
        }
        const targetDate = mode === 'subject_card' ? presentStudentsDate : resultContextDate;
        if (targetDate) {
            endpoint += `&examDate=${targetDate}`;
        }
        const response = await api.get(endpoint, {
            responseType: 'blob'
        });
        const sectionName = targetSectionsInternal.find((s: any) => s.id === effectivePresentTargetClassId)?.name || 'Section';
        
        let examNameForFile = effectiveExaminationName;
        if (mode === 'subject_card' && presentStudentsExamId) {
            const foundExam = exams.find((ex: any) => ex.id === presentStudentsExamId);
            if (foundExam) examNameForFile = foundExam.name;
        }
        
        const safeExamName = (examNameForFile || 'Exam').replace(/[^a-zA-Z0-9-_\.]/g, '_');
        const safeSectionName = sectionName.replace(/[^a-zA-Z0-9-_\.]/g, '_');
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${safeExamName}_${safeSectionName}_Present_Students.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Excel downloaded successfully");
    } catch (err: any) {
        toast.error("Failed to download Excel");
    } finally {
        setIsExporting(false);
    }
  };
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishAll = async () => {
    if (!currentExam || !resultContextDate || !targetSubjectId) return;
    setIsPublishing(true);
    try {
      const dirtyRows = fullResultList.filter(s => s._isDirty || (s.marksObtained != null && !s.resultId) || (studentAiFeedback && studentAiFeedback.some((f: any) => f.studentId === s.studentId)));
      if (dirtyRows.length === 0) {
        toast.info("No changes to save.");
        return;
      }
      if (dirtyRows.length > 0) {
            const resultsToSave = dirtyRows.map(s => {
                let aiFeedback = null;
                if (studentAiFeedback && Array.isArray(studentAiFeedback)) {
                    aiFeedback = studentAiFeedback.find((f: any) => f.studentId === s.studentId);
                }
                return {
                    studentId: s.studentId,
                    marksObtained: s.marksObtained !== null && s.marksObtained !== undefined && s.marksObtained !== '' ? Number(s.marksObtained) : null,
                    maxMarks: s.maxMarks !== null && s.maxMarks !== undefined ? Number(s.maxMarks) : null,
                    aiFeedback: aiFeedback
                };
            });
            await examResultService.bulkSaveResults(effectiveExaminationId, resultContextDate, targetSubjectId, resultsToSave);
      }
      const res = await examResultService.publishResults(effectiveExaminationId, resultContextDate, targetSubjectId);
      if (res.success) {
        const count = res.data || 0;
        toast.success(`${count} result${count === 1 ? '' : 's'} published successfully`);
        
        // Refresh the global published results view
        await fetchFullResultList();
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to publish results.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePublishResult = async (studentId: string) => {
    if (!currentExam || !resultContextDate || !targetSubjectId) return;
    try {
      const res = await examResultService.publishResults(effectiveExaminationId, resultContextDate, targetSubjectId, studentId);
      if (res.success) {
        toast.success('Student result published!');
        await fetchFullResultList();
        if (enteringMarksForStudent && enteringMarksForStudent.studentId === studentId) {
            setEnteringMarksForStudent(null);
        }
      }
    } catch (e) {
      toast.error('Failed to publish student result.');
    }
  };

  const handleDeleteResultContext = async () => {
      if (!deleteResultContext) return;
      setIsDeletingResult(true);
      try {
          const res = await examResultService.deleteResultsForClass(
              effectiveExaminationId,
              undefined,
              deleteResultContext.examDate,
              deleteResultContext.classSubjectId
          );
          if (res.success) {
              toast.success('Result deleted successfully');
              setDeleteResultContext(null);
              
              // If the user happens to have the workspace open for this exact context, close it safely
              if (resultContextDate === deleteResultContext.examDate && resultContextSubjectId === deleteResultContext.classSubjectId) {
                  setResultContextDate('');
                  setResultContextSubjectId('');
                  setSubjectCardViewMode('IDLE');
              }
              
              await fetchSavedContexts();
          }
      } catch (e: any) {
          toast.error(e.response?.data?.message || 'Failed to delete result context');
      } finally {
          setIsDeletingResult(false);
      }
  };
  
  const handleOpenStudentResult = async (student: any) => {
      let percentage = 0;
      let grade = '-';
      const maxMarks = student.maxMarks > 0 ? student.maxMarks : 0;
      if (maxMarks > 0 && student.marksObtained !== null && student.marksObtained !== undefined) {
         percentage = (student.marksObtained / maxMarks) * 100;
         if (percentage >= 90) grade = 'A+';
         else if (percentage >= 80) grade = 'A';
         else if (percentage >= 70) grade = 'B+';
         else if (percentage >= 60) grade = 'B';
         else if (percentage >= 50) grade = 'C';
         else if (percentage >= 40) grade = 'D';
         else grade = 'F';
      }

      const mappedStudent = {
          ...student,
          name: student.studentName,
          enrollmentNumber: student.enrollmentNo,
          className: student.section || workspaceContext?.className,
          totalMarks: student.marksObtained !== null && student.marksObtained !== undefined ? student.marksObtained : 0,
          totalMax: maxMarks,
          percentage: percentage,
          grade: student.grade || grade,
          subjectMarks: [{
              subjectCode: workspaceContext?.subjectCode || '',
              name: workspaceContext?.subjectName || '',
              max: maxMarks,
              obtained: student.marksObtained !== null && student.marksObtained !== undefined ? student.marksObtained : '',
              remarks: student.remarks || ''
          }]
      };
      setEnteringMarksForStudent(mappedStudent);
      
      try {
         let studentFeedback: any = null;
         
         // First check if we have unsaved AI feedback in state
         if (studentAiFeedback && Array.isArray(studentAiFeedback)) {
             studentFeedback = studentAiFeedback.find((f: any) => f.studentId === student.studentId || f.studentId === student.id);
         }
         
         // If not in state, try to fetch from backend (saved feedback)
         if (!studentFeedback && currentExam) {
             const aiFeedback = await examResultService.getAIFeedback(
                 effectiveExaminationId, 
                 student.section || student.className || selectedClassInternal,
                 resultContextDate,
                 targetSubjectId
             );
             if (aiFeedback && aiFeedback.data) {
                 studentFeedback = aiFeedback.data.find((f: any) => f.studentId === student.studentId || f.studentId === student.id);
             }
         }
         
         if (studentFeedback) {
             setEnteringMarksForStudent((prev: any) => ({
                 ...prev,
                 overallFeedback: studentFeedback.overallPerformance,
             }));
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
      if (!currentExam || role !== 'student' || activeTab !== 'results') return;
      setIsStudentResultsLoading(true);
      try {
        const res = await examResultService.getResultsByExamAndClass(effectiveExaminationId, undefined, resultContextDate, targetSubjectId);
        if (res.success && res.data) {
          setStudentResults(res.data);
        }
        
        const aiRes = await examResultService.getAIFeedback(effectiveExaminationId);
        if (aiRes.success && aiRes.data && aiRes.data.length > 0) {
          setStudentAiFeedback(aiRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch student results:", err);
      } finally {
        setIsStudentResultsLoading(false);
      }
    };
    
    fetchStudentResults();
  }, [currentExam, activeTab, role]);
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

  // Examination Attendance (Admin)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'UNMARKED' | 'PRESENT' | 'ABSENT'>>({});
  const [persistedAttendanceMap, setPersistedAttendanceMap] = useState<Record<string, 'UNMARKED' | 'PRESENT' | 'ABSENT'>>({});
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceViewMode, setAttendanceViewMode] = useState<'cards' | 'detail'>('cards');
  const [selectedAttendanceRoomId, setSelectedAttendanceRoomId] = useState<string | null>(null);

  // Modal States
  const [showDiscardAttendanceModal, setShowDiscardAttendanceModal] = useState(false);
  const [showUnmarkedAttendanceModal, setShowUnmarkedAttendanceModal] = useState(false);
  const [showDeleteSeatingModal, setShowDeleteSeatingModal] = useState(false);
  const [isDeletingSeating, setIsDeletingSeating] = useState(false);

  useEffect(() => {
    setPersistentData('acronexus_seating', savedSeatingLists);
  }, [savedSeatingLists]);

  useEffect(() => {
    const fetchSeatingPlan = async () => {
      if ((activeTab !== 'seating' && activeTab !== 'attendance') || !currentExam) return;
      
      setIsLoadingData(true);
      try {
        const res = await api.get(`/examinations/${effectiveExaminationId}/seating`);
        if (res.data.success && res.data.data) {
           setSeatingGenerated(res.data.data);
           setSeatingSaved(true);
           setSeatingViewMode('saved');
        } else {
           setSeatingGenerated(null);
           setSeatingSaved(false);
           setSeatingViewMode('create');
        }
      } catch (err: any) {
        if (err.response?.status === 404 || err.response?.status === 400) {
           setSeatingGenerated(null);
           setSeatingSaved(false);
           setSeatingViewMode('create');
        } else {
           toast.error(err.response?.data?.message || "Failed to fetch seating plan");
        }
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchSeatingPlan();
  }, [activeTab, selectedExam]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (activeTab !== 'attendance' || !currentExam || !seatingSaved) return;

      setAttendanceMap({});
      setPersistedAttendanceMap({});
      setAttendanceLoaded(false);
      setIsLoadingData(true);
      try {
        const res = await api.get(`/examinations/${effectiveExaminationId}/attendance`);
        if (res.data.success && res.data.data) {
           const map: Record<string, 'UNMARKED' | 'PRESENT' | 'ABSENT'> = {};
           res.data.data.forEach((a: any) => {
               map[a.studentId] = a.isPresent ? 'PRESENT' : 'ABSENT';
           });
           setAttendanceMap(map);
           setPersistedAttendanceMap(map);
           setAttendanceLoaded(true);
        }
      } catch (err: any) {
        console.error("Failed to load attendance", err);
        setAttendanceMap({});
        setPersistedAttendanceMap({});
        setAttendanceLoaded(false);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchAttendance();
  }, [activeTab, currentExam, seatingSaved]);

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
  // Helpers
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
      setCreateCoordinatorAssignmentId(exam.coordinatorAssignmentId || '');
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
      setCreateCoordinatorAssignmentId('');
      
      // Auto-select if non-hod and exactly 1 active assignment
      if (role !== 'hod' && examCapabilities?.activeCoordinatorAssignments?.length === 1) {
          setCreateCoordinatorAssignmentId(examCapabilities.activeCoordinatorAssignments[0].id);
      }
    }
    setIsCreatingExam(true);
  };

  const handleSaveExam = async () => {
    if (!createExamName || !createBatch || !createYear || !createSemester || createClasses.length === 0 || !createStartDate || !createEndDate) {
      toast.error("Please fill all required fields.");
      return;
    }

    if (role !== 'hod' && !createCoordinatorAssignmentId) {
      toast.error("Please select the coordinator assignment you are fulfilling.");
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
      timetableFileId: null,
      coordinatorAssignmentId: createCoordinatorAssignmentId || null
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
  
  const handleAssignCoordinator = async () => {
    if (!assignFacultyId || !assignExamPurpose || !assignValidUntil) {
      toast.error("Please fill all required fields.");
      return;
    }
    
    setIsAssigningCoordinator(true);
    try {
      const payload = {
        assignedUserId: assignFacultyId,
        examPurpose: assignExamPurpose,
        validUntil: assignValidUntil
      };
      const res = await api.post('/exam-coordinator-assignments', payload);
      if (res.data.success) {
        toast.success("Exam coordinator assigned successfully");
        setDepartmentAssignments([res.data.data, ...departmentAssignments]);
        setAssignFacultyId('');
        setAssignExamPurpose('');
        setAssignValidUntil('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to assign exam coordinator");
    } finally {
      setIsAssigningCoordinator(false);
    }
  };

  const handleRevokeCoordinator = async (id: string) => {
    try {
      const res = await api.patch(`/exam-coordinator-assignments/${id}/revoke`);
      if (res.data.success) {
        toast.success("Assignment revoked successfully");
        setDepartmentAssignments(departmentAssignments.map(a => a.id === id ? { ...a, isActive: false } : a));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to revoke assignment");
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
        if (effectiveExaminationId === examToDelete) {
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
    if (!currentExam) return;
    try {
      const response = await api.get(`/examination-notices/examination/${effectiveExaminationId}`);
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
  }, [currentExam, activeTab]);

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
        effectiveExaminationId: effectiveExaminationId,
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

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    if (!effectiveExaminationId) {
      toast.error("Please select an Examination first.");
      setUploadStatus('idle');
      return;
    }
    if (!resultContextDate || !targetSubjectId) {
      toast.error("Strict context (Exam Date and Subject) must be provided for result uploads.");
      setUploadStatus('idle');
      return;
    }

    setUploadStatus('reading');
    try {
      // Call preview API by passing previewOnly = true
      const res = await examResultService.uploadResults(file, effectiveExaminationId, selectedClassInternal, resultContextDate, targetSubjectId, true);
      
      if (res.success || res.processingStatus === 'COMPLETED' || res.processingStatus === 'PARTIAL_SUCCESS') {
        const previewRows = res.previewRows || [];
        if (previewRows.length === 0) {
           console.error("No valid preview rows found. Backend error log:", res.errorLog);
           toast.error(res.errorLog?.length > 0 ? "Validation Failed: " + res.errorLog[0].errorMessage : "No valid matching rows found in the uploaded file.");
           setUploadStatus('error');
           return;
        }

        toast.success(`Preview ready: ${previewRows.length} rows matched successfully.`);
        
        // Fetch ALL canonical students assigned to this exact ClassSubject
        const allStudents = await fetchFullResultList(effectiveExaminationId, resultContextDate, targetSubjectId);
        
        if (!allStudents || allStudents.length === 0) {
            toast.error("Failed to load assigned students. Please ensure students are actively enrolled in this examination batch.");
            setUploadStatus('error');
            return;
        }

        // Map previewRows onto fullResultList by canonical studentId
        setFullResultList(allStudents.map((student: any) => {
            const matchedRow = previewRows.find((pr: any) => pr.studentId === student.studentId);
            if (matchedRow && matchedRow.valid !== false) {
                return {
                    ...student,
                    marksObtained: matchedRow.marksObtained,
                    maxMarks: matchedRow.maxMarks,
                    grade: matchedRow.grade,
                    resultStatus: "Draft",
                    _isDirty: true
                };
            }
            return student; // Non-uploaded students remain Pending or as they were
        }));
        
        setUploadStatus('completed');
        if (mode === 'subject_card') {
           setCreateResultFlowState('RESULT_READY');
        }
      } else {
        const firstError = res.errorLog && res.errorLog.length > 0 ? res.errorLog[0].errorMessage : '';
        toast.error(`Upload failed: ${firstError || "No valid records processed."}`);
        setUploadStatus('error');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process result preview.");
      setUploadStatus('error');
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
              <input id="result-upload-file" type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => { 
                  if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files[0]);
                  } 
              }} />
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

  const handleSaveBulkResults = async () => {
    const dirtyRows = fullResultList.filter(s => s._isDirty || (studentAiFeedback && studentAiFeedback.some((f: any) => f.studentId === s.studentId)));
    if (dirtyRows.length === 0) {
      toast.info("No changes to save.");
      return;
    }

    try {
      const resultsToSave = dirtyRows.map(row => {
        let aiFeedback = null;
        if (studentAiFeedback && Array.isArray(studentAiFeedback)) {
            aiFeedback = studentAiFeedback.find((f: any) => f.studentId === row.studentId);
        }
        return {
          studentId: row.studentId,
          marksObtained: row.marksObtained,
          maxMarks: row.maxMarks,
          aiFeedback: aiFeedback
        };
      });

      const res = await examResultService.bulkSaveResults(effectiveExaminationId, resultContextDate, targetSubjectId, resultsToSave);
      if (res.success) {
        toast.success(`Successfully saved ${dirtyRows.length} results.`);
        setFullResultList(prev => prev.map(s => ({ ...s, _isDirty: false })));
        // Immediately go to Saved Results view to show the new card
        if (mode === 'subject_card') {
            setSubjectCardViewMode('SAVED_RESULTS');
            setResultContextDate(''); // Show cards list
        }
        await fetchSavedContexts(); // Refresh cards
      } else {
        toast.error(res.message || "Failed to save results.");
      }
    } catch (err: any) {
      console.error("Bulk save error:", err);
      toast.error(err.response?.data?.message || "An error occurred while saving results.");
    }
  };

  const renderSavedContextCards = () => {
    if (isSavedContextsLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 opacity-60">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-4" />
          <p className="text-slate-500 font-medium">Loading saved results...</p>
        </div>
      );
    }
    
    // Filter out contexts that don't match the current subject if we're in subject card mode
    const filteredContexts = mode === 'subject_card' && workspaceContext 
      ? savedResultContexts.filter(ctx => ctx.classSubjectId === workspaceContext.id)
      : savedResultContexts;

    if (!filteredContexts || filteredContexts.length === 0) {
      return (
        <div className="text-center p-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 mt-6">
          <FolderOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Saved Results</h3>
          <p className="text-slate-500 max-w-sm mx-auto">There are no saved results for this subject yet. Create new results to see them here.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filteredContexts.map((ctx: any, idx: number) => {
          const isFullyPublished = ctx.publishedStudents === ctx.totalStudents && ctx.totalStudents > 0;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                setResultContextDate(ctx.examDate);
                setResultContextSubjectId(ctx.classSubjectId);
                setResultContextSet(true);
                fetchFullResultList(effectiveExaminationId, ctx.examDate, ctx.classSubjectId);
              }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{new Date(ctx.examDate).toLocaleDateString()}</h3>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{ctx.subjectCode}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold shadow-sm",
                  isFullyPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                )}>
                  {isFullyPublished ? 'PUBLISHED' : 'DRAFT'}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                  <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Users size={14} /> Total Enrolled
                  </span>
                  <span className="text-sm font-bold text-slate-800">{ctx.totalStudents}</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                  <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <CheckSquare size={14} /> Result Saved
                  </span>
                  <span className="text-sm font-bold text-slate-800">{ctx.savedStudents}</span>
                </div>
                
                <div className="flex justify-between items-center bg-emerald-50 p-2 rounded-md border border-emerald-100">
                  <span className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                    <Check size={14} /> Published
                  </span>
                  <span className="text-sm font-bold text-emerald-800">{ctx.publishedStudents}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-semibold gap-1 px-2" onClick={(e) => { e.stopPropagation(); setDeleteResultContext(ctx); }}>
                  <Trash2 size={16} /> Delete
                </Button>
                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold gap-1">
                  View Results <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderResultsTable = () => {
    // Augment data directly before filtering
    const augmentedData = fullResultList.map(student => {
      const isPresent = student.attendanceStatus === 'PRESENT';
      const displayAttendance = isPresent ? 'PRESENT' : 'ABSENT';
      
      let effectiveStatus = 'Pending';
      if (!isPresent) {
         effectiveStatus = 'ABSENT';
      } else if (student.resultId) {
         if (student.isPublished) {
             effectiveStatus = 'Published';
         } else {
             // Use backend status, mapping 'Saved' to 'Draft' to align with UI semantics
             const backendStatus = student.resultStatus || 'Draft';
             effectiveStatus = backendStatus.toLowerCase() === 'saved' ? 'Draft' : backendStatus;
         }
      } else if (student.marksObtained != null) {
         effectiveStatus = 'Draft';
      }

      let effectiveGrade = student.grade || '-';
      if (!student.grade && student.marksObtained != null && student.maxMarks != null && student.maxMarks > 0) {
          const percentage = (Number(student.marksObtained) / Number(student.maxMarks)) * 100;
          let calculatedGrade = 'F';
          if (percentage >= 90) calculatedGrade = 'A+';
          else if (percentage >= 80) calculatedGrade = 'A';
          else if (percentage >= 70) calculatedGrade = 'B+';
          else if (percentage >= 60) calculatedGrade = 'B';
          else if (percentage >= 50) calculatedGrade = 'C';
          else if (percentage >= 40) calculatedGrade = 'D';
          effectiveGrade = calculatedGrade;
      }
      
      return {
          ...student,
          displayAttendance,
          effectiveStatus,
          effectiveGrade
      };
    });

    const filteredData = augmentedData.filter(student => {
      const sName = student.studentName || student.name || 'Unknown';
      const sEnrollment = student.enrollmentNo || student.enrollmentNumber || 'Unknown';
      const matchesSearch = sName.toLowerCase().includes(resultSearch.toLowerCase()) || sEnrollment.toLowerCase().includes(resultSearch.toLowerCase());
      
      const matchesStatus = resultStatusFilter === 'All' ? true : 
                            student.effectiveStatus === resultStatusFilter;
                            
      return matchesSearch && matchesStatus;
    });

    const isAllDraft = filteredData.length > 0 && filteredData.every(s => (s.marksObtained != null && !s.isPublished));
    const isAllPublished = filteredData.length > 0 && filteredData.every(s => s.isPublished);

    const totalStudents = augmentedData.length;
    const enteredResults = augmentedData.filter(s => s.marksObtained != null).length;
    // Pending only includes PRESENT students awaiting result
    const pendingResults = augmentedData.filter(s => s.effectiveStatus === 'Pending').length;
    
    const validMarks = augmentedData.filter(s => s.marksObtained != null).map(s => Number(s.marksObtained) || 0);
    const highestScore = validMarks.length > 0 ? Math.max(...validMarks) : 0;
    const averageScore = validMarks.length > 0 ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(1) : 0;

    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col space-y-4 p-4 mt-4">
        {mode === 'subject_card' && subjectCardViewMode === 'SAVED_RESULTS' && resultContextDate && (
            <div className="flex justify-start border-b border-border pb-4 mb-2">
                <Button 
                    variant="ghost" 
                    className="gap-2 text-slate-600 hover:text-slate-900 -ml-2"
                    onClick={() => {
                        setResultContextDate('');
                        setResultContextSet(false);
                    }}
                >
                    <ChevronRight size={16} className="rotate-180" /> Back to Saved Results
                </Button>
            </div>
        )}
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
              <option value="ABSENT">Absent</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {fullResultList.some(s => s._isDirty) && (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full md:w-auto"
                  onClick={handleSaveBulkResults}
                >
                  <CheckCircle size={16} /> Save Result
                </Button>
            )}
            {!isAllPublished && filteredData.length > 0 && (
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 w-full md:w-auto"
                  onClick={handlePublishAll}
                  disabled={isPublishing}
                >
                  <CheckCircle size={16} /> {isPublishing ? 'Publishing...' : 'Publish All'}
                </Button>
            )}
            {uploadStatus === 'completed' && (
                <Button variant="outline" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 gap-2 w-full md:w-auto" onClick={() => {
                  setUploadStatus('idle');
                  setUploadedFile(null);
                  setUploadedMarks([]);
                  setResultUploadMethod('upload');
                  if (mode === 'subject_card') {
                      setCreateResultFlowState('UPLOAD_FILE');
                  }
                  // Clear dirty flags and fetch original list
                  fetchFullResultList();
                  toast.success('Upload discarded');
                }}>
                  <Trash2 size={16} /> Discard Upload
                </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-4 border-y border-border">
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Total Students</p>
               <p className="text-xl font-black">{totalStudents}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Entered</p>
               <p className="text-xl font-black text-emerald-500">{enteredResults}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Pending</p>
               <p className="text-xl font-black text-amber-500">{pendingResults}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Highest Score</p>
               <p className="text-xl font-black">{highestScore}</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-muted-foreground font-semibold uppercase">Average Score</p>
               <p className="text-xl font-black">{averageScore}</p>
             </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-accent/50 text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Enrollment No.</th>
                <th className="px-4 py-3 text-center">Attendance</th>
                <th className="px-4 py-3 text-center">Total Marks</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.map((student, index) => {
                const effectiveStatus = student.effectiveStatus;
                return (
                <tr key={student.studentId || index} className={cn("transition-colors", student._isDirty ? "bg-primary/10 border-l-4 border-primary" : "hover:bg-accent/20")}>
                  <td className="px-4 py-3 font-bold text-foreground">{student.name || student.studentName || 'Unknown'}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{student.enrollmentNumber || student.enrollmentNo || 'Unknown'}</td>
                  <td className="px-4 py-3 text-center font-bold">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium",
                      student.displayAttendance === 'PRESENT' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {student.displayAttendance}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{student.marksObtained != null ? student.marksObtained : '-'}</td>
                  <td className="px-4 py-3 text-center font-bold">
                    <span className={cn(
                      "px-2 py-1 rounded-md", 
                      student.effectiveGrade === 'A+' || student.effectiveGrade === 'A' ? "bg-emerald-100 text-emerald-700" :
                      student.effectiveGrade === 'B+' || student.effectiveGrade === 'B' ? "bg-blue-100 text-blue-700" :
                      student.effectiveGrade === 'C' ? "bg-amber-100 text-amber-700" : 
                      student.effectiveGrade === 'D' || student.effectiveGrade === 'P' ? "bg-orange-100 text-orange-700" :
                      student.effectiveGrade === 'F' ? "bg-rose-100 text-rose-700" : "bg-muted text-muted-foreground"
                    )}>
                      {student.effectiveGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      effectiveStatus === 'Published' ? 'bg-emerald-100 text-emerald-700' :
                      effectiveStatus === 'Draft' ? 'bg-amber-100 text-amber-700' :
                      effectiveStatus === 'ABSENT' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    )}>
                      {effectiveStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleOpenStudentResult(student)}>
                         <Edit size={14} className="text-blue-500" />
                       </Button>
                       {effectiveStatus === 'Draft' && (
                         <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handlePublishResult(student.studentId)}>
                           <CheckCircle size={14} className="text-emerald-500" />
                         </Button>
                       )}
                       {effectiveStatus === 'Draft' && (
                         <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-rose-500">
                           <Trash2 size={14} />
                         </Button>
                       )}
                    </div>
                  </td>
                </tr>
              )})}
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
    const examClasses = currentExam?.classNames || [];

    const renderSubjectCardExamSelector = () => {
      if (mode !== 'subject_card') return null;
      if (subjectCardViewMode === 'IDLE') return null;
      
      // In CREATE_RESULT mode, only show if we're in SELECT_EXAM, SELECT_DATE or UPLOAD_FILE
      if (subjectCardViewMode === 'CREATE_RESULT' && 
          (createResultFlowState === 'IDLE' || createResultFlowState === 'RESULT_READY')) {
          return null;
      }

      return (
        <div className="flex gap-2 items-center flex-wrap">
          <select
            className="p-2 border border-border rounded-lg bg-background min-w-[200px]"
            value={subjectCardExamId}
            onChange={(e) => {
              const examId = e.target.value;
              setSubjectCardExamId(examId);
              setSubjectCardSelectedExam(exams.find((ex: any) => ex.id === examId) || null);
              setResultContextDate('');
              if (subjectCardViewMode === 'CREATE_RESULT') {
                  setCreateResultFlowState(examId ? 'SELECT_DATE' : 'SELECT_EXAM');
              }
            }}
          >
            <option value="">-- Select Examination --</option>
            {exams.map((ex: any) => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          
          {subjectCardViewMode === 'CREATE_RESULT' && createResultFlowState !== 'SELECT_EXAM' && subjectCardExamId && (
              <select
                className="p-2 border border-border rounded-lg bg-background min-w-[150px]"
                value={resultContextDate}
                onChange={(e) => {
                    setResultContextDate(e.target.value);
                    if (subjectCardViewMode === 'CREATE_RESULT') {
                        setCreateResultFlowState(e.target.value ? 'UPLOAD_FILE' : 'SELECT_DATE');
                    }
                }}
              >
                <option value="">-- Select Exam Date --</option>
                {availableExamDates.map((date: any) => (
                  <option key={date} value={date}>{date}</option>
                ))}
              </select>
          )}
        </div>
      );
    };

    if (enteringMarksForStudent) return renderStudentResultEntry();

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-bold">Result Management</h3>
              <p className="text-sm text-muted-foreground">Select a class to upload or manage results for {effectiveExaminationName || 'Examination'}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex gap-2 items-center">
              {mode === 'examination' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    className="p-2 border border-border rounded-lg bg-background min-w-[150px]"
                    value={selectedClassInternal}
                    onChange={(e) => {
                      setSelectedClassInternal(e.target.value);
                      setResultContextSubjectId('');
                      setResultContextSet(false);
                      setResultUploadMethod(null);
                      setUploadedFile(null);
                      setUploadStatus('idle');
                    }}
                  >
                    <option value="">-- Select Class --</option>
                    {targetSectionsInternal.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  
                  {selectedClassInternal && (
                     <select 
                        className="p-2 border border-border rounded-lg bg-background min-w-[150px]"
                        value={resultContextSubjectId}
                        onChange={(e) => {
                            setResultContextSubjectId(e.target.value);
                            setResultContextSet(false);
                        }}
                     >
                        <option value="">-- Select Subject --</option>
                        {sectionSubjects.map((sub: any) => (
                            <option key={sub.id} value={sub.id}>{sub.subjectName || sub.subject?.name || sub.name || sub.className} ({sub.subjectCode || sub.subject?.code || sub.code})</option>
                        ))}
                     </select>
                  )}
                  
                  {selectedClassInternal && resultContextSubjectId && availableExamDates.length > 0 && (
                     <select 
                        className="p-2 border border-border rounded-lg bg-background min-w-[150px]"
                        value={resultContextDate}
                        onChange={(e) => setResultContextDate(e.target.value)}
                     >
                        <option value="">-- Select Date --</option>
                        {availableExamDates.map((date: any) => (
                            <option key={date} value={date}>{date}</option>
                        ))}
                     </select>
                  )}
                  
                  {selectedClassInternal && resultContextSubjectId && resultContextDate && !resultContextSet && (
                     <Button onClick={() => setResultContextSet(true)} size="sm">
                       <CheckCircle size={16} className="mr-2" />
                       Set Context
                     </Button>
                  )}
                </div>
              )}
              {mode === 'subject_card' && renderSubjectCardExamSelector()}
              
              {mode === 'subject_card' ? (
                 <>
                   {subjectCardViewMode !== 'SAVED_RESULTS' ? (
                     <Button variant="outline" className="gap-2" onClick={() => {
                        setSubjectCardViewMode('SAVED_RESULTS');
                        setCreateResultFlowState('IDLE');
                     }}>
                       Saved Results
                     </Button>
                   ) : (
                     <Button variant="outline" className="gap-2 bg-accent" onClick={() => {
                        setSubjectCardViewMode('IDLE');
                     }}>
                       Exit Saved Results
                     </Button>
                   )}
                   
                   {subjectCardViewMode !== 'CREATE_RESULT' ? (
                     <Button className="bg-primary text-primary-foreground gap-2" onClick={() => {
                        setSubjectCardViewMode('CREATE_RESULT');
                        setCreateResultFlowState('SELECT_EXAM');
                        setSubjectCardExamId('');
                        setResultContextDate('');
                        setUploadedFile(null);
                        setUploadStatus('idle');
                        setFullResultList([]);
                     }}>
                       <Plus size={16}/> Create Result
                     </Button>
                   ) : (
                     <Button variant="outline" className="gap-2" onClick={() => {
                        setSubjectCardViewMode(fullResultList.length > 0 ? 'SAVED_RESULTS' : 'IDLE');
                        setCreateResultFlowState('IDLE');
                     }}>
                       Cancel Create
                     </Button>
                   )}
                 </>
              ) : (
                 !isCreatingResult ? (
                   <Button className="bg-primary text-primary-foreground gap-2" onClick={() => setIsCreatingResult(true)}>
                     <Plus size={16}/> Create Result
                   </Button>
                 ) : (
                   <Button variant="outline" className="gap-2" onClick={() => setIsCreatingResult(false)}>
                     Cancel Create
                   </Button>
                 )
              )}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col gap-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div>
                <h4 className="font-bold">Present Students</h4>
                <p className="text-sm text-muted-foreground">Download present students list for marks preparation.</p>
             </div>
             <div className="flex gap-2 items-center flex-wrap">
                 {mode === 'examination' && (
                     <>
                         <select 
                             className="p-2 border border-border rounded-lg bg-background min-w-[200px]"
                             value={resultTargetClassId} 
                             onChange={e => {
                                 handleResultSectionChange(e.target.value);
                                 setPresentTargetSubjectId('');
                             }}
                         >
                             <option value="">-- Select Section --</option>
                             {(targetSectionsInternal || []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                         {resultTargetClassId && (
                             <select 
                                className="p-2 border border-border rounded-lg bg-background min-w-[150px]"
                                value={presentTargetSubjectId}
                                onChange={(e) => setPresentTargetSubjectId(e.target.value)}
                             >
                                <option value="">-- All Subjects --</option>
                                {presentSectionSubjects.map((sub: any) => (
                                   <option key={sub.id} value={sub.id}>{sub.subjectName || sub.subject?.name || sub.name || sub.className} ({sub.subjectCode || sub.subject?.code || sub.code})</option>
                                ))}
                             </select>
                         )}
                     </>
                 )}
                 {mode === 'subject_card' && (
                     <div className="flex gap-2 items-center flex-wrap">
                        <select
                           className="p-2 border border-border rounded-lg bg-background min-w-[200px]"
                           value={presentStudentsExamId}
                           onChange={(e) => {
                               const examId = e.target.value;
                               setPresentStudentsExamId(examId);
                               setPresentStudentsDate('');
                           }}
                        >
                           <option value="">-- Select Examination --</option>
                           {exams.map((ex: any) => (
                               <option key={ex.id} value={ex.id}>{ex.name}</option>
                           ))}
                        </select>
                        {presentStudentsExamId && presentStudentsAvailableDates.length > 0 && (
                            <select 
                               className="p-2 border border-border rounded-lg bg-background min-w-[150px]"
                               value={presentStudentsDate}
                               onChange={(e) => setPresentStudentsDate(e.target.value)}
                            >
                               <option value="">-- Select Exam Date --</option>
                               {presentStudentsAvailableDates.map((date: any) => (
                                   <option key={date} value={date}>{date}</option>
                               ))}
                            </select>
                        )}
                        {presentStudentsExamId && presentStudentsAvailableDates.length === 0 && (
                          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                            No attendance found for this subject.
                          </div>
                        )}
                     </div>
                 )}
                 <Button disabled={!effectivePresentTargetClassId || (mode === 'examination' && !presentTargetSubjectId) || isExporting} onClick={handleDownloadPresentStudentsExcel}>
                    {isExporting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Download size={16} className="mr-2"/>}
                    Download Excel
                 </Button>
             </div>
          </div>
          
          {isPresentStudentsLoading && (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p>Loading present students...</p>
              </div>
          )}
          
          {!isPresentStudentsLoading && presentStudentsError && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                  {presentStudentsError}
              </div>
          )}

          {!isPresentStudentsLoading && effectivePresentTargetClassId && mode === 'examination' && !presentTargetSubjectId && (
              <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-accent/20 mt-2">
                  <p>Please select a subject to view the present students.</p>
              </div>
          )}
          
          {!isPresentStudentsLoading && effectivePresentTargetClassId && presentStudentsForSection && presentStudentsForSection.length === 0 && (
              <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-accent/20">
                  <p>No present students found. Examination attendance may not have been recorded for this section yet.</p>
              </div>
          )}
          
          {!isPresentStudentsLoading && presentStudentsForSection && presentStudentsForSection.length > 0 && (
             <div className="overflow-x-auto rounded-lg border border-border mt-2">
                 <table className="w-full text-sm text-left">
                     <thead className="text-xs uppercase bg-muted/50 border-b border-border">
                         <tr>
                             <th className="px-4 py-3 font-semibold">S.No.</th>
                             <th className="px-4 py-3 font-semibold">Enrollment No</th>
                             <th className="px-4 py-3 font-semibold">Student Name</th>
                             <th className="px-4 py-3 font-semibold">Section</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                         {presentStudentsForSection.map((student: any, idx: number) => (
                             <tr key={student.enrollmentNo} className="hover:bg-accent/20">
                                 <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                                 <td className="px-4 py-3 font-medium">{student.enrollmentNo}</td>
                                 <td className="px-4 py-3">{student.studentName}</td>
                                 <td className="px-4 py-3">
                                     <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                         {student.section}
                                     </span>
                                 </td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
          )}
        </div>

           {((mode === 'subject_card' && (createResultFlowState === 'UPLOAD_FILE' || createResultFlowState === 'RESULT_READY')) || (mode === 'examination' && isCreatingResult)) && (
           <div className="flex flex-col gap-4 mt-4">
              <div className="flex gap-4">
                  {/* Upload button only shows when in UPLOAD_FILE state or in examination mode isCreatingResult */}
                  {((mode === 'subject_card' && createResultFlowState === 'UPLOAD_FILE') || (mode === 'examination' && isCreatingResult)) && (
                    <Button 
                      className="flex-1 h-24 flex flex-col gap-2 border-2 transition-all hover:bg-accent/50" 
                      variant={resultUploadMethod === 'upload' ? 'default' : 'outline'}
                      disabled={!selectedClassInternal}
                      onClick={() => setResultUploadMethod('upload')}
                    >
                      <FileSpreadsheet size={32} className={resultUploadMethod === 'upload' ? "text-primary-foreground" : "text-emerald-500"} />
                      <span className="font-semibold">Upload Results (Excel/CSV)</span>
                    </Button>
                  )}
                  {/* AI Feedback Button remains unchanged in location and functionality */}
                  <Button 
                    className="flex-1 h-24 flex flex-col gap-2 border-2 transition-all hover:bg-accent/50" 
                    variant={isGeneratingAIFeedback ? 'default' : 'outline'}
                    disabled={!fullResultList.some(s => s.marksObtained != null) || isGeneratingAIFeedback}
                    onClick={handleGenerateAIFeedback}
                  >
                    {isGeneratingAIFeedback ? (
                      <>
                         <RefreshCw size={32} className="animate-spin text-primary-foreground" />
                         <span className="font-semibold">{aiFeedbackStep}</span>
                      </>
                    ) : (
                      <>
                        <BrainCircuit size={32} className={fullResultList.some(s => s.marksObtained != null) ? "text-purple-500" : "text-muted-foreground"} />
                        <span className="font-semibold">Generate AI Feedback</span>
                      </>
                    )}
                  </Button>
              </div>
      
              {selectedClassInternal && resultUploadMethod === 'upload' && ((mode === 'subject_card' && createResultFlowState === 'UPLOAD_FILE') || (mode === 'examination' && isCreatingResult)) && renderUploadSection()}
           </div>
           )}

           {(() => {
               if (mode === 'subject_card') {
                   if (subjectCardViewMode === 'SAVED_RESULTS') {
                       if (!resultContextDate) return renderSavedContextCards();
                       return renderResultsTable();
                   }
                   if (subjectCardViewMode === 'CREATE_RESULT' && createResultFlowState === 'RESULT_READY') return renderResultsTable();
                   return null;
               } else {
                   if (selectedClassInternal && !isCreatingResult) return renderResultsTable();
                   if (!selectedClassInternal) return renderResultsTable();
                   return null;
               }
           })()}
      </div>
    );
  };

  const renderStudentResultEntry = () => {
    if (!enteringMarksForStudent) return null;

    const handleSubjectMarkChange = (subjectName: string, newObtained: any) => {
      const newSubjectMarks = enteringMarksForStudent.subjectMarks.map((sm: any) => 
        sm.name === subjectName ? { ...sm, obtained: newObtained } : sm
      );
      const totalMax = newSubjectMarks.reduce((sum: number, sm: any) => sum + (Number(sm.max) || 0), 0);
      const totalMarks = newSubjectMarks.reduce((sum: number, sm: any) => sum + (Number(sm.obtained) || 0), 0);
      let percentage = 0;
      let grade = '-';
      
      if (totalMax > 0 && newObtained !== '') {
        percentage = (totalMarks / totalMax) * 100;
        grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 40) grade = 'D';
      }

      const updatedStudent = {
        ...enteringMarksForStudent,
        subjectMarks: newSubjectMarks,
        totalMarks,
        totalMax,
        percentage,
        grade
      };
      
      setEnteringMarksForStudent(updatedStudent);
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
            <p className="font-black text-lg">{enteringMarksForStudent.totalMarks} / {enteringMarksForStudent.totalMax || 0}</p>
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
                    value={subject.obtained === null || subject.obtained === '' ? '' : subject.obtained}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleSubjectMarkChange(subject.name, val === '' ? '' : Number(val));
                    }}
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
          <Button variant="secondary" className="gap-2" onClick={async () => {
             const sm = enteringMarksForStudent.subjectMarks[0];
             if (sm.max <= 0) { toast.error("Max Marks must be greater than 0"); return; }
             if (sm.obtained !== '' && (sm.obtained > sm.max || sm.obtained < 0)) { toast.error("Obtained marks cannot exceed Max marks or be negative"); return; }
             
             try {
                await examResultService.bulkSaveResults(effectiveExaminationId, resultContextDate, targetSubjectId, [{
                   studentId: enteringMarksForStudent.studentId,
                   marksObtained: sm.obtained !== '' ? sm.obtained : null,
                   maxMarks: sm.max,
                   remarks: sm.remarks,
                   aiFeedback: enteringMarksForStudent.overallFeedback ? {
                       overallPerformance: enteringMarksForStudent.overallFeedback
                   } : null
                }]);
                toast.success('Result saved as Draft');
                setEnteringMarksForStudent(null);
                await fetchFullResultList();
             } catch (e: any) {
                toast.error(e.response?.data?.message || 'Failed to save result');
             }
          }}><Save size={16}/> Save Draft</Button>
          <Button className="bg-primary text-primary-foreground" onClick={async () => {
             const sm = enteringMarksForStudent.subjectMarks[0];
             if (sm.max <= 0) { toast.error("Max Marks must be greater than 0"); return; }
             if (sm.obtained !== '' && (sm.obtained > sm.max || sm.obtained < 0)) { toast.error("Obtained marks cannot exceed Max marks or be negative"); return; }
             
             try {
                // Save marks natively
                await examResultService.bulkSaveResults(effectiveExaminationId, resultContextDate, targetSubjectId, [{
                   studentId: enteringMarksForStudent.studentId,
                   marksObtained: sm.obtained !== '' ? sm.obtained : null,
                   maxMarks: sm.max,
                   remarks: sm.remarks,
                   aiFeedback: enteringMarksForStudent.overallFeedback ? {
                       overallPerformance: enteringMarksForStudent.overallFeedback
                   } : null
                }]);
                // Publish it after saving!
                await examResultService.publishResults(effectiveExaminationId, resultContextDate, targetSubjectId, enteringMarksForStudent.studentId);
                toast.success('Result published successfully');
                setEnteringMarksForStudent(null);
                await fetchFullResultList();
             } catch (e: any) {
                toast.error(e.response?.data?.message || 'Failed to publish result');
             }
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
        subjectId: res.subjectId,
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

        {studentAiFeedback && Array.isArray(studentAiFeedback) && (
            (() => {
                const specificFeedback = studentAiFeedback.find((f:any) => 
                    (f.subjectId && viewingSubjectResult.subjectId && f.subjectId === viewingSubjectResult.subjectId) || 
                    (f.subjectCode && viewingSubjectResult.code && f.subjectCode === viewingSubjectResult.code) || 
                    (f.subjectName && viewingSubjectResult.name && f.subjectName === viewingSubjectResult.name)
                );
                if (!specificFeedback) return null;
                return (
                  <div className="bg-accent/30 rounded-xl p-5 text-left border border-border mt-8">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Performance Feedback</h4>
                    <div className="space-y-4">
                      {specificFeedback.strengths && specificFeedback.strengths.length > 0 && (
                         <div>
                           <p className="font-semibold text-emerald-600 mb-1">Strengths:</p>
                           <ul className="list-disc list-inside text-sm text-foreground ml-2">
                             {specificFeedback.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                           </ul>
                         </div>
                      )}
                      {specificFeedback.areasOfImprovement && specificFeedback.areasOfImprovement.length > 0 && (
                         <div>
                           <p className="font-semibold text-rose-600 mb-1">Areas for Improvement:</p>
                           <ul className="list-disc list-inside text-sm text-foreground ml-2">
                             {specificFeedback.areasOfImprovement.map((s: string, i: number) => <li key={i}>{s}</li>)}
                           </ul>
                         </div>
                      )}
                      {specificFeedback.actionPlan && (
                         <div>
                           <p className="font-semibold text-indigo-600 mb-1">Action Plan:</p>
                           <p className="text-sm text-foreground">{specificFeedback.actionPlan}</p>
                         </div>
                      )}
                    </div>
                  </div>
                );
            })()
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
              <p className="text-base"><span className="text-slate-500 uppercase tracking-wider text-xs mr-2">Examination:</span> {effectiveExaminationName}</p>
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
    if (!currentExam) return;
    try {
      const payload = {
        criteria: elgCriteria,
        settings: elgSettings
      };
      
      const response = await api.post(`/examinations/${effectiveExaminationId}/generate-eligibility`, payload);
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
    if (!currentExam) return;
    setIsLoadingData(true);
    try {
      const response = await api.get(`/examinations/${effectiveExaminationId}/eligibility-list`);
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
    if (!currentExam || !elgGeneratedList) return;
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
      await api.post(`/examinations/${effectiveExaminationId}/eligibility-list`, payload);
      
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

  const handlePrintEligibleOnly = () => {
    const previousStatus = elgFilter.status;
    setElgFilter(prev => ({...prev, status: 'Eligible'}));
    setTimeout(() => {
      window.print();
      setElgFilter(prev => ({...prev, status: previousStatus}));
    }, 100);
  };

  const handleDeleteEligibilityList = async (listId?: string) => {
    if (!currentExam) return;
    try {
      await api.delete(`/examinations/${effectiveExaminationId}/eligibility-list/${listId || savedListId}`);
      toast.success("Eligibility list deleted successfully");
      setIsEligibilitySaved(false);
      setElgGeneratedList(null);
      setElgViewMode('create');
    } catch(err) {
      console.error(err);
      toast.error("Failed to delete eligibility list");
    }
  };

  return (
    <>
      {renderResultManagement()}

      <Dialog open={!!deleteResultContext} onOpenChange={(open) => {
          if (!open && !isDeletingResult) {
              setDeleteResultContext(null);
          }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Result?</DialogTitle>
            <DialogDescription>
              This will permanently delete this saved result and remove the published result from students as well. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteResultContext(null)} disabled={isDeletingResult}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteResultContext} disabled={isDeletingResult}>
              {isDeletingResult ? (
                  <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                  </>
              ) : 'Delete Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExamResultWorkspace;





