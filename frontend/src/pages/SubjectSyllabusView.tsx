import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BookOpen, User, UserCheck, FileText, Clock, Award, Sparkles, Hash } from 'lucide-react';

interface SubjectSyllabusViewProps {
  ws: any;
}

export const SubjectSyllabusView: React.FC<SubjectSyllabusViewProps> = ({ ws }) => {
  const [syllabus, setSyllabus] = useState<any>(ws?.linkedSyllabus || null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (ws?.linkedSyllabus) {
      setSyllabus(ws.linkedSyllabus);
      return;
    }

    const fetchSyllabus = async () => {
      if (!ws) return;
      setLoading(true);
      try {
        // First try direct lookup by ID if valid UUID
        if (ws.id && typeof ws.id === 'string' && ws.id.includes('-') && ws.id.length === 36) {
          try {
            const res = await api.get(`/v1/class-subjects/${ws.id}/syllabus`);
            if (res.data?.data) {
              setSyllabus(res.data.data);
              setLoading(false);
              return;
            }
          } catch (e) {
            // Ignore ID lookup error and try matching parameters
          }
        }

        // Fallback parameter match (pure DB query without OCR/AI)
        const params = new URLSearchParams();
        if (ws.subjectCode) params.append('subjectCode', ws.subjectCode);
        if (ws.subjectName) params.append('subjectName', ws.subjectName);
        if (ws.department) params.append('department', ws.department);
        if (ws.semester) params.append('semester', ws.semester);
        if (ws.className) params.append('className', ws.className);

        const res = await api.get(`/v1/class-subjects/match-syllabus?${params.toString()}`);
        if (res.data?.data) {
          setSyllabus(res.data.data);
        } else {
          setSyllabus(null);
        }
      } catch (err) {
        console.error('Error fetching subject syllabus:', err);
        setSyllabus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabus();
  }, [ws]);

  // Helper to format raw content into authentic document formatting (clean headings & naturally wrapping paragraphs)
  const renderFormattedContent = (raw: string) => {
    if (!raw) return null;

    // Preprocess: Repair OCR line breaks that fractured unit titles (e.g. "Unit \n I:" -> "Unit I:")
    const content = raw.replaceAll(/(\b(?:UNIT|MODULE|SECTION))\s*\r?\n\s*([-–—−]?\s*(?:0?[1-9]|IV|V?I{1,3}|VI{1,3}|IX|X)\b)/gi, '$1 $2');
    const lines = content.split(/\r?\n/);
    const blocks: { type: 'heading' | 'paragraph'; text: string }[] = [];

    const SECTION_KEYWORDS = [
      'Textbooks Recommended',
      'Text Books Recommended',
      'Recommended Text Books',
      'Recommended Books',
      'Reference Books',
      'Detailed Contents',
      'Course Objectives',
      'Course Objective',
      'Course Outcomes',
      'Course Outcome',
      'Course Contents',
      'Course Description',
      'List of Experiments',
      'List of Practicals',
      'Online Resources',
      'Web Resources',
      'Pre-Requisites',
      'Pre-Requisite',
      'Prerequisites',
      'Prerequisite',
      'Bibliography',
      'References',
      'Text Books',
      'Textbook',
      'Practicals',
      'Experiments',
      'Introduction',
      'Overview',
      'Syllabus',
    ];

    let currentParagraph: { type: 'paragraph'; text: string } | null = null;

    const pushParagraph = (txt: string) => {
      if (!txt) return;
      const cleaned = txt
        .replaceAll(/([a-zA-Z0-9]),([a-zA-Z])/g, '$1, $2')
        .replaceAll(/([a-z])\.([A-Z])/g, '$1. $2');

      if (currentParagraph && blocks.includes(currentParagraph)) {
        if (/[\w]-$/.test(currentParagraph.text)) {
          currentParagraph.text += cleaned.trim();
        } else {
          currentParagraph.text += ' ' + cleaned.trim();
        }
      } else {
        currentParagraph = { type: 'paragraph', text: cleaned.trim() };
        blocks.push(currentParagraph);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();
      if (!trimmed) {
        currentParagraph = null;
        continue;
      }

      // Ignore table separator artifacts like |---|---|
      if (trimmed.replaceAll(/[\s|-]/g, '').length === 0 && trimmed.includes('-')) {
        currentParagraph = null;
        continue;
      }

      // Numbered items or bullet prefixes indicate a fresh logical paragraph sentence (do NOT convert to HTML lists/cards/chips)
      if (/^(\d+[\.)]|[-*•])\s+/.test(trimmed)) {
        currentParagraph = null;
      }

      let remainder = trimmed;

      while (remainder.length > 0) {
        let extractedHeading: string | null = null;

        // 1. Unit / Module / Section headers (with comprehensive support for hyphens, en-dash, em-dash, and minus)
        const unitMatch = remainder.match(/^(UNIT|MODULE|SECTION)\s*[-–—−]?\s*(0?[1-9]|I{1,3}|IV|V|VI{1,3}|IX|X)\b\s*[:.-]?\s*/i);
        if (unitMatch) {
          const type = unitMatch[1].charAt(0).toUpperCase() + unitMatch[1].slice(1).toLowerCase();
          const num = unitMatch[2].toUpperCase();
          extractedHeading = `${type} ${num}`;
          remainder = remainder.slice(unitMatch[0].length).trim();
        } else {
          // 2. Recognized standalone section keywords (strict matching without false positives on topic phrases or list items)
          for (const keyword of SECTION_KEYWORDS) {
            const kwRegex = new RegExp(`^(${keyword})\\b(?!\\s*,)\\s*[:.-]?\\s*`, 'i');
            const match = remainder.match(kwRegex);
            if (match) {
              if (keyword === 'Introduction' || keyword === 'Overview' || keyword === 'Syllabus') {
                let after = remainder.slice(match[0].length).trim().toLowerCase();
                if (!after && i + 1 < lines.length) {
                  after = lines[i + 1].trim().toLowerCase();
                }
                const nextWord = after.split(/[,\s:.-]+/)[0];
                if (['to', 'of', 'into', 'in', 'with', 'for', 'on', 'by', 'via', 'and', 'or', '&', 'as', 'from', 'through'].includes(nextWord)) {
                  break;
                }
              }
              extractedHeading = keyword;
              remainder = remainder.slice(match[0].length).trim();
              break;
            }
          }
        }

        if (extractedHeading) {
          currentParagraph = null;
          blocks.push({ type: 'heading', text: extractedHeading });
        } else {
          break;
        }
      }

      if (remainder.length > 0) {
        pushParagraph(remainder);
      }
    }

    return (
      <div className="py-2 text-foreground font-normal">
        {blocks.map((block, idx) =>
          block.type === 'heading' ? (
            <h3 key={idx} className="text-base sm:text-lg font-bold text-foreground mt-7 mb-2.5 tracking-tight first:mt-1">
              {block.text}
            </h3>
          ) : (
            <p key={idx} className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3.5 last:mb-0 text-justify">
              {block.text}
            </p>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 fade-in duration-300">
      {/* ----------------------------------
          Subject Information
         ---------------------------------- */}
      <Card className="border border-border/60 shadow-sm bg-gradient-to-br from-card via-card to-card/90 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600" />
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold tracking-tight">Subject Information</CardTitle>
          </div>
          <CardDescription>Key details and faculty assignments for this course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Code */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-primary/5 border border-primary/15 transition-all hover:bg-primary/10">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                <Hash className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject Code</p>
                <p className="text-base font-extrabold text-foreground truncate mt-0.5">{ws?.subjectCode || 'N/A'}</p>
              </div>
            </div>

            {/* Subject Name */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 transition-all hover:bg-blue-500/10">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subject Name</p>
                <p className="text-base font-extrabold text-foreground truncate mt-0.5" title={ws?.subjectName}>{ws?.subjectName || 'N/A'}</p>
              </div>
            </div>

            {/* Faculty */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 transition-all hover:bg-indigo-500/10">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faculty</p>
                <p className="text-base font-extrabold text-foreground truncate mt-0.5" title={ws?.facultyName}>{ws?.facultyName || 'Unassigned'}</p>
              </div>
            </div>

            {/* Coordinator */}
            <div className="flex items-center gap-3.5 p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 transition-all hover:bg-purple-500/10">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coordinator</p>
                <p className="text-base font-extrabold text-foreground truncate mt-0.5" title={ws?.coordinatorName}>{ws?.coordinatorName || 'Not Assigned'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------------
          Subject Syllabus
         ---------------------------------- */}
      <Card className="border border-border/60 shadow-sm bg-card">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-bold tracking-tight">Subject Syllabus</CardTitle>
            </div>
            <CardDescription>Automatically linked from the department academic curriculum</CardDescription>
          </div>
          {syllabus && (
            <div className="flex flex-wrap gap-2">
              {syllabus.credits && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1.5 shadow-xs">
                  <Award className="w-3.5 h-3.5" />
                  Credits: {syllabus.credits}
                </Badge>
              )}
              {syllabus.theoryHours && (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-3 py-1 font-semibold flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Theory: {syllabus.theoryHours} hrs
                </Badge>
              )}
              {syllabus.practicalHours && (
                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3 py-1 font-semibold flex items-center gap-1.5 shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Practical: {syllabus.practicalHours} hrs
                </Badge>
              )}
              {syllabus.type && (
                <Badge variant="outline" className="px-3 py-1 font-semibold capitalize border-border/80">
                  {syllabus.type}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Loading course syllabus...</p>
            </div>
          ) : !syllabus ? (
            <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 text-muted-foreground shadow-xs">
                <FileText className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-foreground">No syllabus available for this subject.</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The syllabus will be automatically matched and displayed here once uploaded by the Department HOD in Faculty Management.
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              {renderFormattedContent(syllabus.rawContent)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
