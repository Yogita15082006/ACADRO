package com.acronexus.service;

import com.acronexus.dto.SubjectAnalyticsDTO;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubjectAnalyticsService {

    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final ExamResultRepository examResultRepository;

    public List<SubjectAnalyticsDTO> getSubjectAnalytics(UUID classSubjectId) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        
        UUID acroClassId = classSubject.getAcroClass().getId();
        
        // 1. Get all active students for the class
        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClassId);
        List<Student> students = enrollments.stream().map(StudentEnrollment::getStudent).collect(Collectors.toList());

        // 2. Fetch bulk data for this classSubject
        // Attendance
        List<StudentAttendance> attendances = studentAttendanceRepository.findByClassSubjectId(classSubjectId);
        int totalClassesConducted = (int) attendances.stream()
                .map(sa -> sa.getSession() != null ? sa.getSession().getId().toString() : sa.getDate().toString())
                .distinct()
                .count();
        
        // Assignments
        List<Assignment> assignments = assignmentRepository.findByClassSubjectId(classSubjectId);
        int totalAssignments = (int) assignments.stream().map(Assignment::getId).distinct().count();
        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignment_ClassSubject_Id(classSubjectId);
        
        // Quizzes
        List<Quiz> quizzes = quizRepository.findByClassSubject_IdAndIsDeletedFalseOrderByStartTimeDesc(classSubjectId);
        int totalQuizzes = (int) quizzes.stream().map(Quiz::getId).distinct().count();
        
        // Since quizAttemptRepository doesn't have findByQuiz_ClassSubject_Id, we get by quizIds
        List<UUID> quizIds = quizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        List<QuizAttempt> allQuizAttempts = new ArrayList<>();
        if (!quizIds.isEmpty()) {
            allQuizAttempts = quizAttemptRepository.findByQuiz_IdIn(quizIds);
        }

        // Examinations
        List<ExamResult> examResults = examResultRepository.findByClassSubjectId(classSubjectId);

        // 3. Process each student
        List<SubjectAnalyticsDTO> results = new ArrayList<>();
        
        for (Student student : students) {
            UUID studentId = student.getUser().getId();
            SubjectAnalyticsDTO dto = new SubjectAnalyticsDTO();
            dto.setId(studentId);
            dto.setName(student.getUser().getFirstName() + " " + (student.getUser().getLastName() == null ? "" : student.getUser().getLastName()));
            dto.setEnrollmentNumber(student.getEnrollmentNo());
            dto.setEmail(student.getUser().getEmail());
            
            // Calculate Attendance
            long presentCount = attendances.stream()
                .filter(a -> a.getStudent().getId().equals(studentId))
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE)
                .map(sa -> sa.getSession() != null ? sa.getSession().getId().toString() : sa.getDate().toString())
                .distinct()
                .count();
                
            int attendancePercentage = totalClassesConducted > 0 ? (int) Math.round((double) presentCount / totalClassesConducted * 100) : 0;
            
            SubjectAnalyticsDTO.AttendanceMetricsDTO attMetrics = new SubjectAnalyticsDTO.AttendanceMetricsDTO();
            attMetrics.setTotal(totalClassesConducted);
            attMetrics.setPresent((int) presentCount);
            attMetrics.setAbsent(totalClassesConducted - (int) presentCount);
            attMetrics.setPercentage(attendancePercentage);
            
            // Calculate Assignments
            long submittedCount = submissions.stream()
                .filter(s -> s.getStudent().getId().equals(studentId))
                .map(s -> s.getAssignment().getId())
                .distinct()
                .count();
                
            int assignmentPercentage = totalAssignments > 0 ? (int) Math.round((double) submittedCount / totalAssignments * 100) : 0;
            
            SubjectAnalyticsDTO.AssignmentMetricsDTO asnMetrics = new SubjectAnalyticsDTO.AssignmentMetricsDTO();
            asnMetrics.setTotal(totalAssignments);
            asnMetrics.setSubmitted((int) submittedCount);
            asnMetrics.setPending(totalAssignments - (int) submittedCount);
            asnMetrics.setPercentage(assignmentPercentage);
            
            // Calculate Quizzes
            List<QuizAttempt> studentAttempts = allQuizAttempts.stream()
                .filter(q -> q.getStudent().getId().equals(studentId))
                .collect(Collectors.toList());
                
            long uniqueAttemptedQuizzes = studentAttempts.stream()
                .map(q -> q.getQuiz().getId())
                .distinct()
                .count();
                
            int attemptedCount = (int) uniqueAttemptedQuizzes;
            double totalScore = studentAttempts.stream()
                .map(QuizAttempt::getScore)
                .filter(Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .sum();
                
            double sumPercentage = 0;
            for (QuizAttempt attempt : studentAttempts) {
                double score = attempt.getScore() != null ? attempt.getScore().doubleValue() : 0;
                int totalQ = attempt.getQuiz().getTotalMarks() != null ? attempt.getQuiz().getTotalMarks().intValue() : 100;
                if(totalQ == 0) totalQ = 100; 
                double percentage = (score / totalQ) * 100;
                sumPercentage += percentage;
            }
            
            int quizAverage = studentAttempts.size() > 0 ? (int) Math.round(sumPercentage / studentAttempts.size()) : 0;
            
            SubjectAnalyticsDTO.QuizMetricsDTO quizMetrics = new SubjectAnalyticsDTO.QuizMetricsDTO();
            quizMetrics.setTotal(totalQuizzes);
            quizMetrics.setAttempted(attemptedCount);
            quizMetrics.setAverage(quizAverage);
            
            // Calculate Examinations
            List<ExamResult> studentExams = examResults.stream()
                .filter(e -> e.getStudent().getId().equals(studentId))
                .collect(Collectors.toList());
                
            List<SubjectAnalyticsDTO.ExaminationMetricsDTO> examMetrics = studentExams.stream().map(e -> {
                SubjectAnalyticsDTO.ExaminationMetricsDTO em = new SubjectAnalyticsDTO.ExaminationMetricsDTO();
                em.setExaminationId(e.getExamination().getId());
                em.setExamResultId(e.getId());
                em.setName(e.getExamination().getName());
                em.setObtainedMarks(e.getMarksObtained());
                em.setMaxMarks(e.getMaxMarks());
                em.setExamDate(e.getExamDate());
                em.setIsPublished(e.getIsPublished());
                return em;
            }).collect(Collectors.toList());
            
            // Calculate Overall Score
            int overallScore = (int) Math.round((assignmentPercentage * 0.3) + (quizAverage * 0.4) + (attendancePercentage * 0.3));
            
            String badge;
            String badgeColor;
            String grade;
            String feedback;
            
            if (overallScore >= 90) {
                badge = "Excellent";
                badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                feedback = "Consistently performs well in assignments, quizzes and attendance. Keep up the excellent work.";
                grade = "O";
            } else if (overallScore >= 80) {
                badge = "Very Good";
                badgeColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
                feedback = "Strong academic performance with good attendance. Focus on improving quiz scores.";
                grade = "A+";
            } else if (overallScore >= 70) {
                badge = "Good";
                badgeColor = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
                feedback = "Regular attendance and assignment submissions. More quiz practice is recommended.";
                grade = "A";
            } else if (overallScore >= 60) {
                badge = "Average";
                badgeColor = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
                feedback = "Performance is satisfactory but there is room for improvement in assignments and attendance.";
                grade = "B+";
            } else if (overallScore >= 50) {
                badge = "Needs Improvement";
                badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
                feedback = "Low attendance and incomplete assignments are affecting overall performance.";
                grade = "B";
            } else {
                badge = "Needs Improvement";
                badgeColor = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
                feedback = "Immediate attention is recommended. Low attendance and poor performance.";
                grade = "C";
            }
            
            SubjectAnalyticsDTO.MetricsDTO metrics = new SubjectAnalyticsDTO.MetricsDTO();
            metrics.setAssignments(asnMetrics);
            metrics.setQuizzes(quizMetrics);
            metrics.setAttendance(attMetrics);
            metrics.setExaminations(examMetrics);
            metrics.setOverallScore(overallScore);
            metrics.setBadge(badge);
            metrics.setBadgeColor(badgeColor);
            metrics.setGrade(grade);
            metrics.setFeedback(feedback);
            
            dto.setMetrics(metrics);
            results.add(dto);
        }
        
        // Sort by overall score descending
        results.sort((a, b) -> Integer.compare(b.getMetrics().getOverallScore(), a.getMetrics().getOverallScore()));
        
        return results;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public byte[] exportSubjectAnalyticsExcel(UUID classSubjectId) {
        ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        
        UUID acroClassId = classSubject.getAcroClass().getId();
        String subjectType = classSubject.getSubject().getType() != null ? classSubject.getSubject().getType().toUpperCase() : "THEORY";
        
        // Fetch students
        List<StudentEnrollment> enrollments = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClassId);
        
        // Fetch bulk data
        List<StudentAttendance> attendances = studentAttendanceRepository.findByClassSubjectId(classSubjectId);
        int totalClassesConducted = (int) attendances.stream()
                .map(sa -> sa.getSession() != null ? sa.getSession().getId().toString() : sa.getDate().toString())
                .distinct()
                .count();
                
        List<Assignment> assignments = assignmentRepository.findByClassSubjectId(classSubjectId);
        List<AssignmentSubmission> submissions = assignmentSubmissionRepository.findByAssignment_ClassSubject_Id(classSubjectId);
        
        List<Quiz> quizzes = quizRepository.findByClassSubject_IdAndIsDeletedFalseOrderByStartTimeDesc(classSubjectId);
        List<UUID> quizIds = quizzes.stream().map(Quiz::getId).collect(Collectors.toList());
        List<QuizAttempt> allQuizAttempts = new ArrayList<>();
        if (!quizIds.isEmpty()) {
            allQuizAttempts = quizAttemptRepository.findByQuiz_IdIn(quizIds);
        }
        
        List<ExamResult> examResults = examResultRepository.findByClassSubjectId(classSubjectId);
        
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
             
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Student Analytics");
            
            // Generate Header
            org.apache.poi.ss.usermodel.Row metadataRow = sheet.createRow(0);
            metadataRow.createCell(0).setCellValue("Subject: " + classSubject.getSubject().getName());
            metadataRow.createCell(1).setCellValue("Subject Code: " + classSubject.getSubject().getCode());
            metadataRow.createCell(2).setCellValue("Class: " + (classSubject.getAcroClass().getSection() != null ? classSubject.getAcroClass().getSection() : classSubject.getAcroClass().getName()));
            metadataRow.createCell(3).setCellValue("Semester: " + (classSubject.getSemester() != null ? classSubject.getSemester().getSemesterNumber() : ""));
            metadataRow.createCell(4).setCellValue("Subject Type: " + subjectType);
            
            // Generate Top Header Row (Basic Details | THEORY | LAB)
            org.apache.poi.ss.usermodel.Row topHeaderRow = sheet.createRow(2);
            org.apache.poi.ss.usermodel.CellStyle topHeaderStyle = workbook.createCellStyle();
            topHeaderStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
            org.apache.poi.ss.usermodel.Font topHeaderFont = workbook.createFont();
            topHeaderFont.setBold(true);
            topHeaderStyle.setFont(topHeaderFont);

            org.apache.poi.ss.usermodel.Cell basicDetailsCell = topHeaderRow.createCell(0);
            basicDetailsCell.setCellValue("Basic Details");
            basicDetailsCell.setCellStyle(topHeaderStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(2, 2, 0, 5));

            org.apache.poi.ss.usermodel.Cell theoryCell = topHeaderRow.createCell(6);
            theoryCell.setCellValue("THEORY");
            theoryCell.setCellStyle(topHeaderStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(2, 2, 6, 8));

            org.apache.poi.ss.usermodel.Cell labCell = topHeaderRow.createCell(9);
            labCell.setCellValue("LAB");
            labCell.setCellStyle(topHeaderStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(2, 2, 9, 12));

            // Generate Columns Row
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(3);
            String[] headers = new String[] {
                "S.No.", "Student Name", "Enrollment Number", "Email ID", "Class", "Semester", 
                "MST (20 Marks)", "Assignment (5 Marks)", "Quiz (5 Marks)",
                "Attendance (5 Marks)", "Assignment (5 Marks)", "File (5 Marks)", "Viva (5 Marks)"
            };
                
            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            
            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            int rowIdx = 4;
            // Sorting students by name
            enrollments.sort((a, b) -> {
                String nameA = a.getStudent().getUser().getFirstName() + " " + (a.getStudent().getUser().getLastName() != null ? a.getStudent().getUser().getLastName() : "");
                String nameB = b.getStudent().getUser().getFirstName() + " " + (b.getStudent().getUser().getLastName() != null ? b.getStudent().getUser().getLastName() : "");
                return nameA.compareToIgnoreCase(nameB);
            });
            
            for (StudentEnrollment enr : enrollments) {
                Student student = enr.getStudent();
                UUID studentId = student.getId();
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                
                row.createCell(0).setCellValue(rowIdx - 4);
                row.createCell(1).setCellValue(student.getUser().getFirstName() + " " + (student.getUser().getLastName() != null ? student.getUser().getLastName() : ""));
                row.createCell(2).setCellValue(student.getEnrollmentNo());
                row.createCell(3).setCellValue(student.getUser().getEmail());
                row.createCell(4).setCellValue(classSubject.getAcroClass().getSection() != null ? classSubject.getAcroClass().getSection() : classSubject.getAcroClass().getName());
                row.createCell(5).setCellValue(classSubject.getSemester() != null ? String.valueOf(classSubject.getSemester().getSemesterNumber()) : "");
                
                // Calculate Assignment (5 Marks) - Used for both Theory and Lab
                double totalAssignmentAwarded = 0;
                double totalAssignmentPossible = 0;
                boolean hasAssignmentSubmissions = false;
                
                for (Assignment assignment : assignments) {
                    if (assignment.getMaxMarks() == null || assignment.getMaxMarks() <= 0) continue;
                    // Find latest submission for this assignment by this student
                    AssignmentSubmission sub = submissions.stream()
                        .filter(s -> s.getAssignment().getId().equals(assignment.getId()) && s.getStudent().getId().equals(studentId))
                        .max(Comparator.comparing(AssignmentSubmission::getSubmittedAt))
                        .orElse(null);
                        
                    if (sub != null && sub.getMarksAwarded() != null) {
                        hasAssignmentSubmissions = true;
                        totalAssignmentAwarded += sub.getMarksAwarded().doubleValue();
                        totalAssignmentPossible += assignment.getMaxMarks();
                    }
                }
                Double assignmentMarks = null;
                if (hasAssignmentSubmissions && totalAssignmentPossible > 0) {
                    assignmentMarks = (totalAssignmentAwarded / totalAssignmentPossible) * 5.0;
                    if (assignmentMarks > 5.0) assignmentMarks = 5.0; 
                }
                
                // ================= THEORY =================
                
                // MST (20 Marks)
                Double mstMarks = null;
                double totalMstObtained = 0;
                double totalMstMax = 0;
                boolean hasMst = false;
                for (ExamResult er : examResults) {
                    if (er.getStudent().getId().equals(studentId) && 
                        er.getExamination() != null && 
                        er.getExamination().getType() == ExamType.MID_TERM &&
                        er.getMarksObtained() != null && 
                        er.getMaxMarks() != null && er.getMaxMarks().doubleValue() > 0) {
                        
                        hasMst = true;
                        totalMstObtained += er.getMarksObtained().doubleValue();
                        totalMstMax += er.getMaxMarks().doubleValue();
                    }
                }
                if (hasMst && totalMstMax > 0) {
                    mstMarks = (totalMstObtained / totalMstMax) * 20.0;
                    if (mstMarks > 20.0) mstMarks = 20.0;
                }
                
                // Quiz (5 Marks)
                List<QuizAttempt> studentAttempts = allQuizAttempts.stream()
                    .filter(q -> q.getStudent().getId().equals(studentId))
                    .collect(Collectors.toList());
                    
                Double quizMarks = null;
                if (!studentAttempts.isEmpty()) {
                    double sumPercentage = 0;
                    for (QuizAttempt attempt : studentAttempts) {
                        double score = attempt.getScore() != null ? attempt.getScore().doubleValue() : 0;
                        double totalQ = attempt.getQuiz().getTotalMarks() != null && attempt.getQuiz().getTotalMarks().doubleValue() > 0 
                            ? attempt.getQuiz().getTotalMarks().doubleValue() : 100.0;
                        sumPercentage += (score / totalQ);
                    }
                    quizMarks = (sumPercentage / studentAttempts.size()) * 5.0;
                    if (quizMarks > 5.0) quizMarks = 5.0;
                }
                
                // Set THEORY cells (6: MST, 7: Assignment, 8: Quiz)
                if (mstMarks != null) {
                    row.createCell(6).setCellValue(Math.round(mstMarks * 100.0) / 100.0);
                }
                
                if (assignmentMarks != null) {
                    row.createCell(7).setCellValue(Math.round(assignmentMarks * 100.0) / 100.0);
                }
                
                if (quizMarks != null) {
                    row.createCell(8).setCellValue(Math.round(quizMarks * 100.0) / 100.0);
                }
                
                // ================= LAB =================
                
                // Attendance (5 Marks)
                long presentCount = attendances.stream()
                    .filter(a -> a.getStudent().getId().equals(studentId))
                    .filter(a -> a.getStatus() == AttendanceStatus.PRESENT || a.getStatus() == AttendanceStatus.LATE)
                    .map(sa -> sa.getSession() != null ? sa.getSession().getId().toString() : sa.getDate().toString())
                    .distinct()
                    .count();
                    
                Double attendanceMarks = null;
                if (totalClassesConducted > 0) {
                    double percentage = (double) presentCount / totalClassesConducted * 100.0;
                    attendanceMarks = percentage * 5.0 / 100.0;
                    if (attendanceMarks > 5.0) attendanceMarks = 5.0;
                }
                
                // Set LAB cells (9: Attendance, 10: Assignment, 11: File, 12: Viva)
                if (attendanceMarks != null) {
                    row.createCell(9).setCellValue(Math.round(attendanceMarks * 100.0) / 100.0);
                }
                
                if (assignmentMarks != null) {
                    row.createCell(10).setCellValue(Math.round(assignmentMarks * 100.0) / 100.0);
                }
                
                // Cells 11 (File) and 12 (Viva) remain blank as requested
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            sheet.createFreezePane(0, 3);
            
            workbook.write(out);
            return out.toByteArray();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to generate Excel file", e);
        }
    }
}
