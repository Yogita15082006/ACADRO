package com.acronexus.service.impl;

import com.acronexus.dto.ApiResponse;
import com.acronexus.dto.AttendanceSessionRequestDto;
import com.acronexus.dto.AttendanceSessionResponseDto;
import com.acronexus.dto.AttendanceSubmitRequestDto;
import com.acronexus.entity.AttendanceStatus;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.Student;
import com.acronexus.entity.StudentAttendance;
import com.acronexus.entity.User;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.StudentAttendanceRepository;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.StudentRepository;
import com.acronexus.repository.UserRepository;
import com.acronexus.repository.FacultyActivityRepository;
import com.acronexus.repository.FacultyRepository;
import com.acronexus.entity.FacultyActivity;
import com.acronexus.entity.FacultyActivityStatus;
import com.acronexus.entity.Faculty;
import com.acronexus.service.AttendanceService;
import com.acronexus.service.AiService;
import com.acronexus.dto.ai.AiAnalyticsRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentAttendanceRepository studentAttendanceRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final FacultyActivityRepository facultyActivityRepository;
    private final FacultyRepository facultyRepository;
    private final AiService aiService;

    private static final int EXPIRY_MINUTES = 5;

    @Override
    @Transactional
    public ApiResponse<AttendanceSessionResponseDto> createSession(AttendanceSessionRequestDto request, UUID facultyId) {
        Optional<ClassSubject> csOpt = classSubjectRepository.findByAcademicYearIdAndSemesterIdAndAcroClassIdAndSubjectIdAndFacultyIdAndIsActiveTrue(
                request.getAcademicYearId(), request.getSemesterId(), request.getClassId(), request.getSubjectId(), facultyId
        );

        if (csOpt.isEmpty()) {
            return ApiResponse.error("Invalid class subject or unauthorized faculty.");
        }

        UUID classSubjectId = csOpt.get().getId();
        
        // Generate a 6-digit random code
        String code = generateUniqueCode();
        
        Faculty faculty = facultyRepository.getReferenceById(facultyId);
        ClassSubject classSubject = classSubjectRepository.getReferenceById(classSubjectId);
        User markedBy = userRepository.getReferenceById(facultyId);

        FacultyActivity activity = new FacultyActivity();
        activity.setFaculty(faculty);
        activity.setClassSubject(classSubject);
        activity.setDate(LocalDate.now());
        
        int count = facultyActivityRepository.countByFacultyIdAndClassSubjectIdAndDate(facultyId, classSubjectId, LocalDate.now());
        activity.setLectureNumber(count + 1);
        
        activity.setStatus(FacultyActivityStatus.PRESENT);
        activity.setReason("SESSION:" + code);
        activity.setMarkedBy(markedBy);
        
        activity = facultyActivityRepository.saveAndFlush(activity);
        
        Instant expiresAt = activity.getCreatedAt().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);

        return ApiResponse.success("Attendance session created successfully.",
                AttendanceSessionResponseDto.builder()
                        .sessionId(activity.getId())
                        .attendanceCode(code)
                        .expiresAt(expiresAt)
                        .build());
    }

    @Override
    @Transactional
    public ApiResponse<String> submitAttendance(AttendanceSubmitRequestDto request, UUID studentId) {
        String code = request.getAttendanceCode().toUpperCase();
        Optional<FacultyActivity> activityOpt = facultyActivityRepository.findByReason("SESSION:" + code);

        if (activityOpt.isEmpty()) {
            return ApiResponse.error("Invalid or expired attendance code.");
        }

        FacultyActivity activity = activityOpt.get();
        Instant expiresAt = activity.getCreatedAt().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);
        
        if (Instant.now().isAfter(expiresAt)) {
            return ApiResponse.error("Attendance session has expired.");
        }

        UUID classId = activity.getClassSubject().getAcroClass().getId();
        UUID classSubjectId = activity.getClassSubject().getId();

        // Check if student is actively enrolled in the class for the correct academic year and semester
        boolean isEnrolled = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classId).stream()
                .anyMatch(e -> e.getStudent().getId().equals(studentId) 
                        && e.getAcademicYear() != null 
                        && e.getAcademicYear().getId().equals(activity.getClassSubject().getAcademicYear().getId())
                        && e.getSemester() != null
                        && e.getSemester().getId().equals(activity.getClassSubject().getSemester().getId()));
        
        if (!isEnrolled) {
            return ApiResponse.error("You are not enrolled in this class subject for the current academic year and semester.");
        }

        LocalDate today = LocalDate.now();

        // Check for duplicates
        boolean alreadyMarked = studentAttendanceRepository.existsByStudentIdAndClassSubjectIdAndDate(studentId, classSubjectId, today);
        if (alreadyMarked) {
            return ApiResponse.error("Attendance already marked for today.");
        }

        // Save attendance
        Student student = studentRepository.getReferenceById(studentId);
        ClassSubject classSubject = classSubjectRepository.getReferenceById(classSubjectId);
        User markedBy = userRepository.getReferenceById(studentId); // Student marked for themselves

        StudentAttendance attendance = new StudentAttendance();
        attendance.setClassSubject(classSubject);
        attendance.setStudent(student);
        attendance.setDate(today);
        attendance.setStatus(AttendanceStatus.PRESENT);
        attendance.setMarkedBy(markedBy);

        studentAttendanceRepository.save(attendance);

        // Detect suspicious attendance patterns and verification
        try {
            java.util.Map<String, Object> aiData = new java.util.HashMap<>();
            aiData.put("studentId", studentId.toString());
            aiData.put("classSubjectId", classSubjectId.toString());
            aiData.put("date", today.toString());
            aiData.put("latitude", request.getLatitude());
            aiData.put("longitude", request.getLongitude());
            aiData.put("faceDataProvided", request.getFaceData() != null && !request.getFaceData().isEmpty());
            
            AiAnalyticsRequest aiRequest = AiAnalyticsRequest.builder()
                    .insightType("ATTENDANCE_VERIFICATION")
                    .data(aiData)
                    .build();
            
            aiService.getInsights(aiRequest);
        } catch (Exception e) {
            log.error("AI attendance verification and analytics failed", e);
            // Non-blocking, so we continue even if AI fails
        }

        return ApiResponse.success("Attendance marked successfully.", null);
    }

    @Override
    public ApiResponse<AttendanceSessionResponseDto> getSession(UUID sessionId) {
        Optional<FacultyActivity> activityOpt = facultyActivityRepository.findById(sessionId);
        if (activityOpt.isEmpty()) {
            return ApiResponse.error("Session not found or expired.");
        }

        FacultyActivity activity = activityOpt.get();
        if (activity.getReason() == null || !activity.getReason().startsWith("SESSION:")) {
            return ApiResponse.error("Session not found or expired.");
        }
        
        Instant expiresAt = activity.getCreatedAt().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES);

        String code = activity.getReason().substring(8); // "SESSION:".length() == 8

        return ApiResponse.success("Session retrieved successfully.",
                AttendanceSessionResponseDto.builder()
                        .sessionId(activity.getId())
                        .attendanceCode(code)
                        .expiresAt(expiresAt)
                        .build());
    }

    @Override
    @Transactional
    public ApiResponse<String> closeSession(UUID sessionId, UUID facultyId) {
        Optional<FacultyActivity> activityOpt = facultyActivityRepository.findById(sessionId);
        if (activityOpt.isEmpty()) {
            return ApiResponse.error("Session not found or already closed.");
        }

        FacultyActivity activity = activityOpt.get();
        if (!activity.getFaculty().getId().equals(facultyId)) {
            return ApiResponse.error("You are not authorized to close this session.");
        }
        
        if (activity.getReason() == null || !activity.getReason().startsWith("SESSION:")) {
            return ApiResponse.error("Session not found or already closed.");
        }

        String code = activity.getReason().substring(8);
        activity.setReason("CLOSED_SESSION:" + code);
        facultyActivityRepository.save(activity);

        return ApiResponse.success("Session closed successfully.", null);
    }

    private String generateUniqueCode() {
        Random rnd = new Random();
        String code;
        boolean exists;
        do {
            int number = rnd.nextInt(999999);
            code = String.format("%06d", number);
            exists = facultyActivityRepository.findByReason("SESSION:" + code).isPresent();
        } while (exists);
        return code;
    }
}
