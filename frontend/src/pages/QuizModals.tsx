import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Plus, Trash2, Sparkles, CheckCircle2, XCircle, AlertCircle, Edit, Upload, 
  BookOpen, Users, Clock, HelpCircle, FileText, Award, BarChart3, FileQuestion, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { quizService } from '../services/quizService';
import type { QuizQuestion, QuizAttempt } from '../services/quizService';

// ─── Creation Method Card Helper ───────────────────────────────────────────
function CreationMethodCard({ title, icon, desc, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center ${
        active ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/50'
      }`}
    >
      <div className={`p-3 rounded-full mb-3 ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {icon}
      </div>
      <h4 className="font-semibold text-foreground mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

// ==========================================
// 1. CREATE QUIZ MODAL
// ==========================================
export function CreateQuizModal({ onClose, onSave, workspaceContext }: any) {
  const [step, setStep] = useState(1);
  const [creationMethod, setCreationMethod] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractionSuccess, setExtractionSuccess] = useState('');

  // Quiz Settings State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalMarks, setTotalMarks] = useState(20);
  const [passingMarks, setPassingMarks] = useState(8);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [sourceUrl, setSourceUrl] = useState('');

  // AI Configuration State
  const [topic, setTopic] = useState('');
  const [unitSyllabus, setUnitSyllabus] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionType, setQuestionType] = useState('MCQ');
  const [marksPerQuestion, setMarksPerQuestion] = useState(2);

  // Questions Review State
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      questionText: 'What is the correct definition of the core concept discussed in this unit?',
      questionType: 'MCQ',
      marks: 2,
      options: [
        { id: 'A', text: 'First primary conceptual definition', isCorrect: true },
        { id: 'B', text: 'Secondary alternative explanation', isCorrect: false },
        { id: 'C', text: 'Contradictory or unrelated statement', isCorrect: false },
        { id: 'D', text: 'None of the above', isCorrect: false }
      ],
      correctAnswer: 'A'
    }
  ]);

  const handleGenerateAI = async (isRegeneration: boolean | any = false) => {
    const regenerating = typeof isRegeneration === 'boolean' && isRegeneration;
    if (!workspaceContext?.id && !workspaceContext?.subjectId) {
      setErrorMessage('Please initiate within a specific Subject workspace to utilize Unit Syllabus integration.');
      return;
    }
    const targetSubjectId = workspaceContext.id || workspaceContext.subjectId;
    try {
      setLoading(true);
      setErrorMessage('');
      const res = await quizService.generateQuestionsAdvanced(targetSubjectId, {
        topic: topic || title || 'Subject Evaluation',
        unitSyllabus,
        count: aiCount,
        difficulty,
        questionType,
        marksPerQuestion,
        timestamp: Date.now().toString()
      });
      if (res && res.rawInsights) {
        try {
          let rawData = res.rawInsights;
          if (typeof rawData === 'string') {
            const arrMatch = rawData.match(/\[.*\]/s);
            if (arrMatch) rawData = arrMatch[0];
          }
          const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const mapped: QuizQuestion[] = parsed.map((q: any, i: number) => ({
              questionText: q.questionText || q.question_text || q.question || q.statement || q.prompt || q.text || q.title || `Generated Question ${i + 1}`,
              questionType: q.questionType || questionType as any,
              marks: q.marks || marksPerQuestion,
              correctAnswer: q.correctAnswer || q.correctOptionId || 'A',
              options: q.options ? q.options.map((opt: any, idx: number) => ({
                id: opt.id || String.fromCharCode(65 + idx),
                text: opt.text || opt.option || String(opt),
                isCorrect: opt.isCorrect || opt.id === q.correctAnswer || idx === 0
              })) : [
                { id: 'A', text: 'Option A (Correct)', isCorrect: true },
                { id: 'B', text: 'Option B', isCorrect: false },
                { id: 'C', text: 'Option C', isCorrect: false },
                { id: 'D', text: 'Option D', isCorrect: false }
              ]
            }));
            setQuestions(mapped);
            setTotalMarks(mapped.reduce((acc, curr) => acc + (curr.marks || 1), 0));
            if (!regenerating) setStep(3);
            return;
          }
        } catch (parseErr) {
          console.error('AI JSON Parse Error:', parseErr);
        }
      }
      setErrorMessage('AI returned no valid questions. Please refine topic and retry.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || '';
      setErrorMessage(msg || 'Failed to generate real questions via AI. Please verify AI service status and connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceExtract = async (url: string) => {
    try {
      setLoading(true);
      setErrorMessage('');
      setExtractionSuccess('');
      const extracted = await quizService.extractFromSource('URL', url);
      if (Array.isArray(extracted) && extracted.length > 0) {
        setQuestions(extracted as any);
        setExtractionSuccess(`Successfully extracted ${extracted.length} questions from URL! Click 'Next: Review Questions' below to proceed.`);
      } else {
        setErrorMessage("No quiz questions found on this webpage. Please provide a URL containing valid test questions or assessment content.");
      }
    } catch (e: any) {
      console.error('Source extraction error', e);
      let errText = e.response?.data?.message || e.response?.data?.error || e.message || "This URL could not be processed. Please provide a publicly accessible URL containing quiz questions.";
      if (typeof errText === 'string') {
        if (errText.startsWith("Bad Request: ")) errText = errText.substring(13).trim();
        if (errText.startsWith("Bad Request:")) errText = errText.substring(12).trim();
        if (errText.startsWith("Internal Server Error: ")) errText = errText.substring(23).trim();
      }
      setErrorMessage(errText);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        questionText: 'New blank question statement...',
        questionType: 'MCQ',
        marks: 2,
        options: [
          { id: 'A', text: 'Option 1', isCorrect: true },
          { id: 'B', text: 'Option 2', isCorrect: false },
          { id: 'C', text: 'Option 3', isCorrect: false },
          { id: 'D', text: 'Option 4', isCorrect: false }
        ],
        correctAnswer: 'A'
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleOptionTextChange = (qIdx: number, optIdx: number, text: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      const opts = [...(updated[qIdx].options || [])];
      opts[optIdx] = { ...opts[optIdx], text };
      updated[qIdx] = { ...updated[qIdx], options: opts };
      return updated;
    });
  };

  const handleOptionCorrectChange = (qIdx: number, optId: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      const opts = (updated[qIdx].options || []).map(o => ({
        ...o,
        isCorrect: o.id === optId
      }));
      updated[qIdx] = { ...updated[qIdx], options: opts, correctAnswer: optId };
      return updated;
    });
  };

  const handlePublish = async () => {
    if (!title) {
      setErrorMessage('Please provide a valid Quiz Title.');
      return;
    }
    const targetSubjectId = workspaceContext?.id || workspaceContext?.subjectId;
    if (!targetSubjectId) {
      setErrorMessage('Class Subject Context is required to publish a quiz.');
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      const createdQuiz = await quizService.createQuiz({
        classSubjectId: targetSubjectId,
        title,
        description,
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        durationMinutes: Number(durationMinutes),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        sourceType: creationMethod === 'ai' ? 'AI' : (sourceUrl ? 'URL' : 'MANUAL'),
        sourceUrl,
        questionType: creationMethod === 'ai' ? questionType : (questions[0]?.questionType || questionType || 'MCQ'),
        difficulty: creationMethod === 'ai' ? difficulty : (difficulty || 'Medium'),
        questionCount: questions ? questions.length : Number(aiCount || 5)
      });

      if (createdQuiz && createdQuiz.id) {
        if (questions && questions.length > 0) {
          const toSave = questions.map(q => ({
            ...q,
            quizId: createdQuiz.id,
            marks: Number(q.marks) || 1
          }));
          await quizService.addQuestions(createdQuiz.id, toSave);
        }
      }
      onSave();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Failed to publish quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-card w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create New LMS Quiz</h2>
            <p className="text-sm text-muted-foreground">
               {step === 1 ? 'Select Creation Workflow' : step === 2 ? 'Configure Assessment Parameters' : 'Review & Finalize Question Bank'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"><X size={20} /></Button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 mb-4 rounded-lg bg-destructive/15 text-destructive border border-destructive/20 text-sm">
              {errorMessage}
            </div>
          )}

          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6 py-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">How would you like to build your assessment?</h3>
                <p className="text-sm text-muted-foreground">Select one of our streamlined production LMS workflows.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CreationMethodCard 
                  title="Create Manually" 
                  icon={<Edit size={28}/>} 
                  desc="Compose questions individually or import supporting source URLs and documents manually." 
                  active={creationMethod === 'manual'} 
                  onClick={() => setCreationMethod('manual')} 
                />
                <CreationMethodCard 
                  title="Generate via AI" 
                  icon={<Sparkles size={28}/>} 
                  desc="Leverage intelligent Unit Syllabus analysis to automatically derive high-quality question items." 
                  active={creationMethod === 'ai'} 
                  onClick={() => setCreationMethod('ai')} 
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* AI Generator Configuration */}
              {creationMethod === 'ai' ? (
                <div className="p-5 border border-primary/30 bg-primary/5 rounded-xl space-y-4 mb-6">
                  <h3 className="font-semibold text-primary flex items-center gap-2"><Sparkles size={18}/> Intelligent Quiz Generator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topic / Chapter Name</label>
                      <input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g., Advanced Transaction & Concurrency Control" value={topic} onChange={e => setTopic(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Unit Syllabus Reference / Learning Outcomes</label>
                      <input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g., ACID properties, 2PL lock algorithms, timestamp ordering" value={unitSyllabus} onChange={e => setUnitSyllabus(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Difficulty Calibration</label>
                      <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                        <option value="Medium">Medium (Balanced)</option>
                        <option value="Easy">Easy (Foundation)</option>
                        <option value="Hard">Hard (Analytical)</option>
                        <option value="Mixed">Mixed (Comprehensive)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Format</label>
                      <select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={questionType} onChange={e => setQuestionType(e.target.value)}>
                        <option value="MCQ">Multiple Choice Questions (MCQ)</option>
                        <option value="Short Answer">Short Answer</option>
                        <option value="True/False">True / False</option>
                        <option value="Fill in the Blanks">Fill in the Blanks</option>
                        <option value="Mixed Questions">Mixed Questions</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Number of Questions</label>
                      <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={aiCount} onChange={e => setAiCount(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Marks per Question</label>
                      <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={marksPerQuestion} onChange={e => setMarksPerQuestion(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 border border-border rounded-xl space-y-4 mb-6 bg-muted/20">
                  <h3 className="font-semibold text-foreground flex items-center gap-2"><Upload size={18}/> Supporting Source Materials (Optional)</h3>
                  <div className="space-y-3">
                    <label className="text-sm text-muted-foreground">Attach a document URL or reference link to assist question curation:</label>
                    <div className="flex gap-2">
                      <input type="url" className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm" placeholder="https://..." value={sourceUrl} onChange={e => { setSourceUrl(e.target.value); setErrorMessage(''); setExtractionSuccess(''); }} />
                      <Button variant="secondary" onClick={() => handleSourceExtract(sourceUrl)} disabled={!sourceUrl || loading}>Extract using AI</Button>
                    </div>
                    {extractionSuccess && (
                      <div className="p-3 mt-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-sm font-medium flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span>{extractionSuccess}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* General Quiz Settings */}
              <h3 className="font-semibold text-lg border-b border-border pb-2">Assessment Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quiz Title *</label>
                  <input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" placeholder="e.g., Module 1 Quiz" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Marks *</label>
                  <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={totalMarks} onChange={e => setTotalMarks(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passing Marks *</label>
                  <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={passingMarks} onChange={e => setPassingMarks(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (Minutes) *</label>
                  <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time *</label>
                  <input type="datetime-local" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Closing Time & Deadline *</label>
                  <input type="datetime-local" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-lg">Review & Refine Questions</h3>
                  <p className="text-xs text-muted-foreground">Ensure accuracy and correct solution assignments before releasing to students.</p>
                </div>
                <div className="flex gap-2">
                  {creationMethod === 'ai' && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleGenerateAI(true)} 
                      disabled={loading} 
                      className="gap-2 text-amber-500 hover:text-amber-600 font-semibold border border-amber-500/30"
                    >
                      <Sparkles size={16} /> {loading ? 'Regenerating via AI...' : 'Regenerate Quiz via AI'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleAddQuestion} className="gap-2"><Plus size={16} /> Add Question</Button>
                </div>
              </div>

              {questions.map((q, idx) => (
                <div key={idx} className="p-5 border border-border rounded-xl bg-card shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm bg-primary/10 text-primary px-3 py-1 rounded-md">Question {idx + 1}</span>
                      <select 
                        className="text-xs font-semibold bg-muted/30 border border-border rounded-md px-2 py-1 text-foreground"
                        value={q.questionType || 'MCQ'}
                        onChange={e => handleQuestionChange(idx, 'questionType', e.target.value)}
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="Short Answer">Short Answer</option>
                        <option value="True/False">True / False</option>
                        <option value="Fill in the Blanks">Fill in the Blanks</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Marks:</span>
                        <input type="number" className="w-16 px-2 py-1 bg-background border border-border rounded text-sm" value={q.marks} onChange={e => handleQuestionChange(idx, 'marks', Number(e.target.value))} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveQuestion(idx)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16} /></Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Question Statement</label>
                    <textarea className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm custom-scrollbar" rows={2} value={q.questionText} onChange={e => handleQuestionChange(idx, 'questionText', e.target.value)} />
                  </div>

                  {q.questionType !== 'Short Answer' && q.questionType !== 'Fill in the Blanks' && q.options && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Options (Select radio for Correct Answer)</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                            <input 
                              type="radio" 
                              name={`q_corr_${idx}`} 
                              checked={opt.isCorrect || q.correctAnswer === opt.id} 
                              onChange={() => handleOptionCorrectChange(idx, opt.id)}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 border-border ml-1" 
                            />
                            <span className="font-bold text-xs text-muted-foreground">{opt.id}:</span>
                            <input 
                              type="text" 
                              className="w-full bg-transparent border-none text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-0" 
                              value={opt.text} 
                              onChange={e => handleOptionTextChange(idx, oIdx, e.target.value)} 
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(q.questionType === 'Short Answer' || q.questionType === 'Fill in the Blanks') && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Correct Solution / Answer Key</label>
                      <input type="text" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" placeholder={q.questionType === 'Fill in the Blanks' ? 'Exact word or phrase for the blank' : 'Correct solution concept...'} value={q.correctAnswer || ''} onChange={e => handleQuestionChange(idx, 'correctAnswer', e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between shrink-0">
          <Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : onClose()}>
             {step > 1 ? 'Back' : 'Cancel'}
          </Button>
          <div className="flex gap-3">
             {step === 1 && (
               <Button onClick={() => setStep(2)}>Next Step</Button>
             )}
             {step === 2 && (
               <Button onClick={creationMethod === 'ai' ? handleGenerateAI : () => setStep(3)} disabled={loading} className="gap-2">
                 {loading ? 'Processing...' : (creationMethod === 'ai' ? 'Generate & Next' : 'Proceed to Questions')}
               </Button>
             )}
             {step === 3 && (
               <Button onClick={handlePublish} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                 <CheckCircle2 size={16} /> {loading ? 'Publishing...' : 'Publish Quiz'}
               </Button>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 2. VIEW QUIZ MODAL (READ-ONLY)
// ==========================================
export function ViewQuizModal({ quiz, onClose }: any) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQ() {
      try {
        setLoading(true);
        const data = await quizService.getQuestions(quiz.id);
        setQuestions(data || []);
      } catch (err) {
        console.error('Error loading questions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchQ();
  }, [quiz.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-card w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span>{quiz.title}</span>
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-semibold">{quiz.status || 'Active'}</Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Subject Assessment Overview</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quiz Settings Overview Box */}
          <div className="bg-muted/30 border border-border/70 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-primary" /> Quiz Settings & Configuration
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Total Marks</span>
                <p className="text-base font-bold text-foreground">{quiz.totalMarks || 0} Marks</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Passing Marks</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{quiz.passingMarks || Math.ceil((quiz.totalMarks || 10) * 0.4)} Marks</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Duration</span>
                <p className="text-base font-bold text-foreground">{quiz.durationMinutes || 30} Minutes</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">Creation Source</span>
                <p className="text-sm font-semibold text-primary/90 capitalize">{quiz.sourceType ? quiz.sourceType.toLowerCase() : 'Manual'}</p>
              </div>
            </div>
            <div className="border-t border-border/50 pt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span><strong className="text-foreground">Start Time:</strong> {quiz.startTime ? new Date(quiz.startTime).toLocaleString() : 'Not set'}</span>
              <span><strong className="text-foreground">End Time:</strong> {quiz.endTime ? new Date(quiz.endTime).toLocaleString() : 'Not set'}</span>
            </div>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No questions have been attached to this quiz yet.</p>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Assessment Questions ({questions.length})</span>
              </h3>
              {questions.map((q, idx) => (
                <Card key={idx} className="border border-border shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-border/50 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm bg-primary/10 text-primary px-3 py-1 rounded">Question {idx + 1}</span>
                        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold">
                          {q.questionType || 'MCQ'}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="font-bold">{q.marks} Marks</Badge>
                    </div>
                    <p className="font-medium text-foreground text-sm sm:text-base leading-relaxed">{q.questionText}</p>
                    {q.options && q.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`p-3 rounded-lg border text-sm flex items-center justify-between ${opt.isCorrect || q.correctAnswer === opt.id ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-border/60 bg-muted/10 text-muted-foreground'}`}>
                            <span><strong className="mr-1.5">{opt.id}:</strong> {opt.text}</span>
                            {(opt.isCorrect || q.correctAnswer === opt.id) && <Badge variant="outline" className="bg-emerald-500 text-white text-[10px]">Correct</Badge>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm flex items-center gap-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Correct Solution ({q.questionType || 'Short Answer'}): </span> 
                        <span className="text-foreground font-semibold">{q.correctAnswer || 'Not provided'}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
          <Button onClick={onClose}>Close View</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 3. GRADE QUIZ MODAL (EVALUATION WORKFLOW)
// ==========================================
export function GradeQuizModal({ quiz, onClose, onSuccess }: any) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answerKeyMap, setAnswerKeyMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const qList = await quizService.getQuestions(quiz.id);
        setQuestions(qList || []);
        const initialMap: Record<string, string> = {};
        (qList || []).forEach((q: QuizQuestion) => {
          if (q.id) {
            initialMap[q.id] = q.correctAnswer || (q.options ? q.options.find(o => o.isCorrect)?.id || 'A' : '');
          }
        });
        setAnswerKeyMap(initialMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [quiz.id]);

  const handleGenerateAiKey = async () => {
    try {
      setAiGenerating(true);
      const res = await quizService.generateAnswerKey(quiz.id);
      if (res && res.rawInsights) {
        let rawData = res.rawInsights;
        if (typeof rawData === 'string') {
          const arrMatch = rawData.match(/\[.*\]/s);
          if (arrMatch) rawData = arrMatch[0];
        }
        const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
        if (Array.isArray(parsed)) {
          const newMap = { ...answerKeyMap };
          parsed.forEach((item: any) => {
            if (item.questionId && (item.correctAnswer || item.correctOptionId)) {
              newMap[item.questionId] = item.correctAnswer || item.correctOptionId;
            }
          });
          setAnswerKeyMap(newMap);
        }
      }
    } catch (err) {
      console.error('Error generating AI Answer Key:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      await quizService.evaluateQuiz(quiz.id, answerKeyMap);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error running evaluation:', err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-card w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-xl font-bold text-foreground">Grade Assessment: {quiz.title}</h2>
            <p className="text-xs text-muted-foreground">Verify solution keys and execute automated grading across all student submissions.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Answer Key Calibration</h3>
              <p className="text-xs text-muted-foreground">Manually update answers below or let AI analyze questions to derive exact solutions.</p>
            </div>
            <Button onClick={handleGenerateAiKey} disabled={aiGenerating || loading} variant="secondary" className="gap-2">
              <Sparkles size={16} className="text-amber-500" />
              {aiGenerating ? 'Deriving Keys...' : 'Generate Answer Key via AI'}
            </Button>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading answer keys...</p>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">Q{idx + 1}: {q.questionText}</span>
                  <span>{q.marks} Marks</span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-xs font-semibold text-primary shrink-0">Correct Solution / Option ID:</label>
                  <input 
                    type="text" 
                    className="w-48 px-3 py-1 bg-background border border-border rounded-lg text-sm font-bold text-emerald-600" 
                    value={q.id ? (answerKeyMap[q.id] || '') : ''} 
                    onChange={e => q.id && setAnswerKeyMap({ ...answerKeyMap, [q.id]: e.target.value })} 
                  />
                  {q.options && (
                    <span className="text-xs text-muted-foreground">Available options: {q.options.map(o => o.id).join(', ')}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleRunEvaluation} disabled={evaluating || loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold">
            <CheckCircle2 size={18} /> {evaluating ? 'Evaluating & Grading...' : 'Evaluate & Grade All Submissions'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 4A. FACULTY READ-ONLY STUDENT ATTEMPT REVIEW MODAL
// ==========================================
function FacultyAttemptReviewModal({ attempt, quiz, onClose }: any) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function loadAnalysis() {
      try {
        setLoading(true);
        const data = await quizService.getAttemptAnalysis(attempt.id);
        if (isMounted) setAnalysis(data);
      } catch (err: any) {
        if (isMounted) setError('Failed to load detailed quiz evaluation from database.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAnalysis();
    return () => { isMounted = false; };
  }, [attempt.id]);

  const questionReviews: any[] = analysis?.questionReviews || [];
  const totalQuestions = analysis?.totalQuestions || questionReviews.length || 0;
  const correctCount = analysis?.correctAnswers ?? attempt.correctAnswers ?? 0;
  const incorrectCount = analysis?.incorrectAnswers ?? attempt.wrongAnswers ?? 0;
  const unattemptedCount = analysis?.unattemptedQuestions ?? attempt.unattemptedQuestions ?? 0;
  const attemptedCount = analysis?.attemptedQuestions ?? (correctCount + incorrectCount);
  const marksObtained = analysis?.marksObtained ?? attempt.score ?? 0;
  const maxMarks = analysis?.totalMarks ?? attempt.totalMarks ?? quiz?.totalMarks ?? 100;
  const percentage = analysis?.percentage ?? attempt.percentage ?? 0;
  const grade = analysis?.grade ?? attempt.grade ?? '--';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} className="relative bg-card w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={attempt.studentProfilePictureUrl || attempt.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(attempt.studentName || 'Student')}&background=4F46E5&color=fff`}
              alt={attempt.studentName || 'Student'}
              className="w-12 h-12 rounded-full object-cover border-2 border-primary/30 shrink-0 shadow-md"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-extrabold text-foreground truncate">{attempt.studentName || 'Student Account'}</h3>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-bold">Read-Only Inspection Mode</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">Enrollment No: {attempt.studentEnrollmentNumber || 'N/A'} • Quiz: {quiz?.title || 'Assessment'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted/50 shrink-0"><X size={20} /></Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold text-sm">{error}</div>}

          {/* QUESTION SUMMARY CARDS */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><BarChart3 size={15} className="text-primary" /> Student Attempt Summary & Evaluation Statistics</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <Card className="border-border bg-muted/20 shadow-sm"><CardContent className="p-3 text-center">
                <div className="text-[11px] text-muted-foreground uppercase font-bold">Total Questions</div>
                <div className="text-xl font-black text-foreground mt-0.5">{totalQuestions}</div>
                <div className="text-[10px] text-muted-foreground">Attempted: {attemptedCount}</div>
              </CardContent></Card>
              <Card className="border-emerald-500/30 bg-emerald-500/[0.04] shadow-sm"><CardContent className="p-3 text-center">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center justify-center gap-1">🟢 Correct</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{correctCount}</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Accurate Answers</div>
              </CardContent></Card>
              <Card className="border-rose-500/30 bg-rose-500/[0.04] shadow-sm"><CardContent className="p-3 text-center">
                <div className="text-[11px] text-rose-600 dark:text-rose-400 uppercase font-bold flex items-center justify-center gap-1">🔴 Incorrect</div>
                <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{incorrectCount}</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Wrong Answers</div>
              </CardContent></Card>
              <Card className="border-slate-500/30 bg-slate-500/[0.04] shadow-sm"><CardContent className="p-3 text-center">
                <div className="text-[11px] text-muted-foreground uppercase font-bold flex items-center justify-center gap-1">⚪ Unanswered</div>
                <div className="text-xl font-black text-foreground mt-0.5">{unattemptedCount}</div>
                <div className="text-[10px] text-muted-foreground font-semibold">Skipped Questions</div>
              </CardContent></Card>
              <Card className="border-primary/30 bg-primary/[0.04] shadow-sm col-span-2 sm:col-span-1 md:col-span-1"><CardContent className="p-3 text-center">
                <div className="text-[11px] text-primary uppercase font-bold">Marks & Outcome</div>
                <div className="text-xl font-black text-foreground mt-0.5">{marksObtained} <span className="text-xs text-muted-foreground font-medium">/ {maxMarks}</span></div>
                <div className="text-[11px] font-bold text-primary mt-0.5">Grade {grade} ({percentage}%)</div>
              </CardContent></Card>
            </div>
          </div>

          {/* AI ANALYSIS SUMMARY (IF AVAILABLE) */}
          {analysis?.aiAnalysis && (
            <Card className="border-primary/30 bg-primary/[0.03] shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-wider"><Sparkles size={16} /> Automated AI Pedagogical Evaluation</span>
                  <Badge variant="outline" className="bg-background/80 text-xs text-muted-foreground font-mono">Stored Evaluation</Badge>
                </div>
                <p className="text-xs font-medium leading-relaxed text-foreground">{analysis.aiAnalysis.summary || "Complete competency evaluation generated successfully."}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase text-[11px] block mb-1">Strong Concept Mastery:</span>
                    <p className="font-medium text-foreground">{analysis.aiAnalysis.strongTopics || "Good grasp of fundamental topics and core concepts."}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/[0.05] border border-amber-500/20">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 uppercase text-[11px] block mb-1">Areas Requiring Revision:</span>
                    <p className="font-medium text-foreground">{analysis.aiAnalysis.weakTopics || analysis.aiAnalysis.frequentlyMissedConcepts || "Review missed objective items and advanced problem applications."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* COMPLETE QUIZ REVIEW */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileQuestion size={18} className="text-primary" /> Comprehensive Question-by-Question Review
              </h4>
              <span className="text-xs font-mono text-muted-foreground">Ordered as presented in quiz</span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-muted-foreground font-medium flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Fetching stored student responses and evaluation details from database...
              </div>
            ) : questionReviews.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground italic border border-dashed border-border rounded-xl bg-muted/10">
                No individual question items were retrieved for this assessment attempt.
              </div>
            ) : (
              <div className="divide-y divide-border/70 border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                {questionReviews.map((q: any, idx: number) => {
                  const isCorrect = q.status === 'correct';
                  const isIncorrect = q.status === 'incorrect';

                  return (
                    <div key={idx} className={`p-5 transition-colors ${isCorrect ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]' : isIncorrect ? 'bg-rose-500/[0.03] hover:bg-rose-500/[0.06]' : 'bg-muted/15 hover:bg-muted/25'}`}>
                      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-black text-foreground px-2.5 py-0.5 rounded bg-muted border border-border/60">Q{q.questionNumber || idx + 1}</span>
                          <Badge variant="outline" className={`text-xs font-bold px-2.5 py-0.5 flex items-center gap-1 ${
                            isCorrect ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' :
                            isIncorrect ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                            'bg-slate-500/15 text-muted-foreground border-border'
                          }`}>
                            {isCorrect ? <>🟢 Correct Answer</> : isIncorrect ? <>🔴 Incorrect Answer</> : <>⚪ Not Answered / Skipped</>}
                          </Badge>
                          <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded bg-muted/40 border border-border/40">{q.questionType || 'MCQ'}</span>
                        </div>
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-full border shadow-2xs ${
                          isCorrect ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          Marks Awarded: {q.marksAwarded} / {q.maximumMarks}
                        </span>
                      </div>

                      <p className="text-base font-bold text-foreground mb-4 leading-relaxed">{q.questionText}</p>

                      {/* OPTIONS FOR MCQs */}
                      {q.options && Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="mb-4 bg-muted/20 p-3.5 rounded-xl border border-border/80 space-y-2">
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">All Options:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt: any, oIdx: number) => {
                              const optText = typeof opt === 'string' ? opt : (opt.text ?? opt.id ?? JSON.stringify(opt));
                              const optId = typeof opt === 'string' ? String.fromCharCode(65 + oIdx) : (opt.id ?? String.fromCharCode(65 + oIdx));
                              const isOptCorrect = typeof opt === 'object' && opt.isCorrect;
                              const isSelected = q.studentAnswer && (
                                q.studentAnswer === optText || 
                                q.studentAnswer === optId || 
                                q.studentAnswer.startsWith(`${optId}.`) ||
                                q.studentAnswer.startsWith(`${optId.toUpperCase()}.`) ||
                                q.studentAnswer.toLowerCase() === optText.toLowerCase()
                              );

                              return (
                                <div key={oIdx} className={`p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2.5 transition-colors ${
                                  isOptCorrect ? 'bg-emerald-500/15 border-emerald-500/40 text-foreground font-bold shadow-2xs' : 
                                  isSelected && isIncorrect ? 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold' : 
                                  'bg-card border-border text-muted-foreground'
                                }`}>
                                  <span className={`font-mono font-black w-6 h-6 rounded flex items-center justify-center text-[11px] shrink-0 border ${
                                    isOptCorrect ? 'bg-emerald-600 text-white border-emerald-600' : 
                                    isSelected && isIncorrect ? 'bg-rose-600 text-white border-rose-600' :
                                    'bg-muted/60 text-foreground border-border/70'
                                  }`}>{optId}</span>
                                  <span className="flex-1 leading-snug">{optText}</span>
                                  <div className="flex flex-col gap-1 items-end shrink-0">
                                    {isOptCorrect && <span className="text-[9px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">Correct Option</span>}
                                    {isSelected && <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/25">Student Selected</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* STUDENT ANSWER VS CORRECT ANSWER COMPARISON */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium">
                        <div className={`p-3.5 rounded-xl border shadow-2xs flex flex-col justify-between ${
                          isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' :
                          isIncorrect ? 'bg-rose-500/10 border-rose-500/30' :
                          'bg-muted/40 border-border'
                        }`}>
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground block font-black mb-1.5">Student's Selected Answer:</span>
                          <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : isIncorrect ? 'text-rose-700 dark:text-rose-400' : 'text-muted-foreground italic'}`}>
                            {q.studentAnswer && q.studentAnswer !== 'Not Attempted' ? q.studentAnswer : '— Not Answered / Skipped —'}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 shadow-2xs flex flex-col justify-between">
                          <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-black mb-1.5">Official Correct Answer Key:</span>
                          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                            {q.correctAnswer || 'Not Specified'}
                          </span>
                        </div>
                      </div>

                      {/* EXPLANATION */}
                      {q.explanation && (
                        <div className="mt-3 p-3.5 rounded-xl border border-border bg-muted/30 text-xs text-foreground space-y-1">
                          <div className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] flex items-center gap-1.5">
                            <BookOpen size={14} className="text-primary" /> Question Explanation:
                          </div>
                          <p className="leading-relaxed font-medium">{q.explanation}</p>
                        </div>
                      )}

                      {/* AI EXPLANATION */}
                      {q.aiExplanation && (
                        <div className="mt-2 p-3.5 rounded-xl border border-primary/25 bg-primary/[0.04] text-xs text-foreground space-y-1">
                          <div className="font-bold uppercase tracking-wider text-primary text-[11px] flex items-center gap-1.5">
                            <Sparkles size={14} className="text-primary" /> AI Explanation & Pedagogical Note:
                          </div>
                          <p className="leading-relaxed font-medium">{q.aiExplanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground italic">Faculty Inspection Mode — All responses, scores, and evaluations are strictly read-only.</span>
          <Button variant="default" className="font-bold px-6 shadow-md" onClick={onClose}>Close Review</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 4. VIEW SUBMISSIONS MODAL (ASSIGNMENT-STYLE)
// ==========================================
export function ViewSubmissionsModal({ quiz, onClose }: any) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAttempts(isInitial = false) {
      try {
        if (isInitial) setLoading(true);
        const data = await quizService.getQuizAttempts(quiz.id);
        if (isMounted) setAttempts(data || []);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        if (isInitial && isMounted) setLoading(false);
      }
    }
    loadAttempts(true);

    const interval = setInterval(() => {
      loadAttempts(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [quiz.id]);

  // Calculate dynamic LMS statistics directly from database records
  const deadlineExpired = quiz.endTime ? new Date().getTime() > new Date(quiz.endTime).getTime() : false;
  const totalStudents = attempts.length > 0 && attempts[0].totalStudents ? attempts[0].totalStudents : attempts.length;
  const submittedAttempts = attempts.filter(a => !!a.completedAt || a.submissionStatus === 'Submitted');
  const attemptedCount = submittedAttempts.length;
  const pendingCount = deadlineExpired ? 0 : Math.max(0, totalStudents - attemptedCount);
  const notAttemptedCount = deadlineExpired ? Math.max(0, totalStudents - attemptedCount) : 0;

  const evaluatedScores = submittedAttempts
    .map(a => (a.score !== undefined && a.score !== null && a.grade !== 'Pending' && a.grade !== '--' ? Number(a.score) : null))
    .filter((s): s is number => s !== null && !isNaN(s));

  const maxMarks = Number(quiz.totalMarks || 100);
  const avgMarks = evaluatedScores.length > 0 ? (evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length).toFixed(1) : '0';
  const highestScore = evaluatedScores.length > 0 ? Math.max(...evaluatedScores) : 0;
  const lowestScore = evaluatedScores.length > 0 ? Math.min(...evaluatedScores) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-card w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Student Submissions & Analytics: {quiz.title}</h2>
            <p className="text-xs text-muted-foreground">Live synchronized student results roster with standard competition rankings and class cohort statistics.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* Dynamic Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-muted/10 text-center">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Students</span>
              <p className="text-2xl font-black text-foreground mt-1">{totalStudents}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-emerald-500/10 text-center">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Attempted</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{attemptedCount}</p>
            </div>
            {!deadlineExpired ? (
              <div className="p-3.5 rounded-xl border border-border bg-amber-500/10 text-center">
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">Pending</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-border bg-rose-500/10 text-center">
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">Not Attempted</span>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{notAttemptedCount}</p>
              </div>
            )}
            <div className="p-3.5 rounded-xl border border-border bg-purple-500/10 text-center">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Average Marks</span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{avgMarks} / {maxMarks}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-blue-500/10 text-center">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Highest Marks</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{highestScore}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-slate-500/10 text-center">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Lowest Marks</span>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-400 mt-1">{lowestScore}</p>
            </div>
          </div>

          {/* Submissions Roster Table */}
          <div className="border border-border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3.5">Student & Enrollment</th>
                  <th className="px-5 py-3.5">Status & Time</th>
                  <th className="px-5 py-3.5">Marks / Max</th>
                  <th className="px-5 py-3.5">Grade & Outcome</th>
                  <th className="px-5 py-3.5">Class Rank</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading interactive roster from database...</td></tr>
                ) : attempts.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">No student records found in this class roster.</td></tr>
                ) : (
                  attempts.map((att) => {
                    const isSubmitted = !!att.completedAt || att.submissionStatus === 'Submitted';
                    const isEvaluated = isSubmitted && att.score !== undefined && att.score !== null && att.grade !== 'Pending' && att.grade !== '--';
                    const statusStr = att.submissionStatus || (isSubmitted ? 'Submitted' : (deadlineExpired ? 'Not Attempted' : 'Pending'));
                    const rankStr = att.classRank || att.rank;
                    
                    return (
                      <tr key={att.id || att.studentId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-medium flex items-center gap-3">
                          <img 
                            src={att.studentProfilePictureUrl || att.studentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(att.studentName || 'Student')}&background=4F46E5&color=fff`} 
                            alt={att.studentName || 'Student'} 
                            className="w-10 h-10 rounded-full object-cover border border-border shrink-0 shadow-sm"
                          />
                          <div className="min-w-0">
                            <div className="text-foreground font-semibold truncate">{att.studentName || 'Student Account'}</div>
                            <div className="text-xs text-muted-foreground font-mono">{att.studentEnrollmentNumber || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="outline" className={
                            statusStr === 'Submitted'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold'
                              : statusStr === 'Not Attempted'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 font-semibold'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold'
                          }>
                            {statusStr}
                          </Badge>
                          {isSubmitted && (att.completedAt || att.startedAt) && (
                            <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                              {new Date(att.completedAt || att.startedAt || '').toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {!isSubmitted && <div className="text-[11px] text-muted-foreground mt-1 font-mono">--</div>}
                        </td>
                        <td className="px-5 py-4 font-bold text-foreground">
                          {!isSubmitted ? (
                            <span className="text-muted-foreground font-mono font-normal">--</span>
                          ) : isEvaluated ? (
                            <span className="text-base">{att.score} <span className="text-xs text-muted-foreground font-normal">/ {att.totalMarks || maxMarks}</span></span>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded">Under Instructor Review</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {!isSubmitted ? (
                            <span className="text-muted-foreground font-mono">--</span>
                          ) : isEvaluated ? (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-primary px-2.5 py-0.5 rounded bg-primary/10">{att.grade}</span>
                              {att.passed ? (
                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[11px]">Passed ({att.percentage ?? 0}%)</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[11px]">Failed ({att.percentage ?? 0}%)</Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600 bg-amber-500/10 border-amber-500/20">Awaiting Manual Grading</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold">
                          {isEvaluated && rankStr ? (
                            <span className="text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded font-mono text-xs font-black">Rank #{rankStr}</span>
                          ) : (
                            <span className="text-muted-foreground font-mono font-normal">--</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isSubmitted ? (
                            <Button size="sm" variant="outline" onClick={() => setSelectedAttempt(att)} className="text-xs border-primary/30 hover:border-primary hover:bg-primary/5 font-semibold">View Responses</Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No attempt recorded</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Student Response Comprehensive Inspection Modal */}
          {selectedAttempt && (
            <FacultyAttemptReviewModal
              attempt={selectedAttempt}
              quiz={quiz}
              onClose={() => setSelectedAttempt(null)}
            />
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
          <Button onClick={onClose}>Close Report</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 5. EDIT QUIZ DEADLINE MODAL (RESTRICTED)
// ==========================================
export function EditQuizDeadlineModal({ quiz, onClose, onSuccess }: any) {
  const [startTime, setStartTime] = useState(quiz.startTime ? new Date(quiz.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState(quiz.endTime ? new Date(quiz.endTime).toISOString().slice(0, 16) : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!startTime || !endTime) {
      setError('Please provide both Start and Closing times.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await quizService.updateQuiz(quiz.id, {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update quiz deadline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="relative bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Quiz Schedule & Deadline</h2>
            <p className="text-xs text-muted-foreground">Restricted edit mode to maintain data consistency & integrity.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Quiz Title (Read Only)</label>
            <input type="text" className="w-full px-3 py-2 bg-muted/40 border border-border rounded-lg text-sm text-muted-foreground font-semibold" value={quiz.title} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Start Time</label>
            <input type="datetime-local" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Closing Time & Deadline</label>
            <input type="datetime-local" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-primary">{loading ? 'Saving...' : 'Update Schedule'}</Button>
        </div>
      </motion.div>
    </div>
  );
}
