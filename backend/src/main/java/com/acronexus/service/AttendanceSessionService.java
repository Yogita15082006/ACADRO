package com.acronexus.service;

import com.acronexus.dto.AttendanceSessionDTO;
import com.acronexus.dto.CreateAttendanceSessionRequest;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceSessionService {

    private final AttendanceSessionRepository sessionRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final FacultyRepository facultyRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    @Transactional
    public AttendanceSessionDTO createSession(UUID facultyId, CreateAttendanceSessionRequest request) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        ClassSubject classSubject = classSubjectRepository.findById(request.getClassSubjectId())
                .orElseThrow(() -> new RuntimeException("Class Subject not found"));

        AttendanceSession session = new AttendanceSession();
        session.setFaculty(faculty);
        session.setClassSubject(classSubject);
        session.setType(request.getType());
        session.setLectureNumber(request.getLectureNumber());
        session.setDate(request.getDate());
        session.setStartTime(request.getStartTime());
        session.setEndTime(request.getEndTime());
        session.setDuration(request.getDuration());
        session.setCode(request.getCode());
        session.setRequireVerification(request.getRequireVerification());
        session.setVerificationQuestion(request.getVerificationQuestion());
        session.setExpectedAnswer(request.getExpectedAnswer());
        session.setStatus(AttendanceSessionStatus.ACTIVE);
        
        // Calculate total students
        int totalStudents = studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(classSubject.getAcroClass().getId()).size();
        session.setTotalStudents(totalStudents);

        session = sessionRepository.save(session);
        return mapToDTO(session);
    }

    public List<AttendanceSessionDTO> getFacultySessions(UUID facultyId) {
        return sessionRepository.findByFacultyId(facultyId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAttendance(UUID sessionId, com.acronexus.dto.MarkAttendanceRequest request) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if (session.getStatus() != AttendanceSessionStatus.ACTIVE) {
            throw new RuntimeException("Session is not active");
        }

        if (session.getCode() != null && !session.getCode().equalsIgnoreCase(request.getAttendanceCode())) {
            throw new RuntimeException("Invalid attendance code");
        }

        if (Boolean.TRUE.equals(session.getRequireVerification())) {
            if (session.getExpectedAnswer() != null && !session.getExpectedAnswer().equalsIgnoreCase(request.getVerificationAnswer())) {
                throw new RuntimeException("Verification answer is incorrect");
            }
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Check if already marked
        boolean alreadyMarked = attendanceRepository.findByStudentIdOrderByDateDesc(student.getId()).stream()
                .anyMatch(a -> a.getSession() != null && a.getSession().getId().equals(sessionId));
        if (alreadyMarked) {
            throw new RuntimeException("Attendance already marked for this session");
        }

        StudentAttendance attendance = new StudentAttendance();
        attendance.setSession(session);
        attendance.setStudent(student);
        attendance.setClassSubject(session.getClassSubject());
        attendance.setDate(session.getDate());
        attendance.setStatus(AttendanceStatus.PRESENT);
        // Marked by student themselves
        attendance.setMarkedBy(student.getUser());

        attendanceRepository.save(attendance);

        session.setPresentCount(session.getPresentCount() + 1);
        sessionRepository.save(session);
    }

    private AttendanceSessionDTO mapToDTO(AttendanceSession session) {
        AttendanceSessionDTO dto = new AttendanceSessionDTO();
        dto.setId(session.getId());
        dto.setClassSubjectId(session.getClassSubject().getId());
        dto.setFacultyId(session.getFaculty().getId());
        dto.setSubjectName(session.getClassSubject().getSubject().getName());
        dto.setFacultyName(session.getFaculty().getUser().getFirstName() + " " + session.getFaculty().getUser().getLastName());
        dto.setAcademicYear(session.getClassSubject().getAcademicYear() != null ? session.getClassSubject().getAcademicYear().getYear() : "");
        dto.setDepartment(session.getClassSubject().getAcroClass().getDepartment().getName());
        dto.setClassName(session.getClassSubject().getAcroClass().getName());
        dto.setType(session.getType());
        dto.setLectureNumber(session.getLectureNumber());
        dto.setDate(session.getDate());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setDuration(session.getDuration());
        dto.setCode(session.getCode());
        dto.setRequireVerification(session.getRequireVerification());
        dto.setVerificationQuestion(session.getVerificationQuestion());
        dto.setExpectedAnswer(session.getExpectedAnswer());
        dto.setStatus(session.getStatus().name());
        dto.setPresentCount(session.getPresentCount());
        dto.setAbsentCount(session.getAbsentCount());
        dto.setTotalStudents(session.getTotalStudents());
        dto.setCreatedAt(session.getCreatedAt() != null ? session.getCreatedAt().toInstant() : null);
        return dto;
    }
}
