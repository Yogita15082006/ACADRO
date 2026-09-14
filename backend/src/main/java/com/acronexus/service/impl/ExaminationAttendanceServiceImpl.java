package com.acronexus.service.impl;

import com.acronexus.dto.ExaminationAttendanceDto;
import com.acronexus.dto.ExaminationAttendanceSaveRequestDto;
import com.acronexus.entity.Examination;
import com.acronexus.entity.ExaminationAttendance;
import com.acronexus.entity.SeatingArrangement;
import com.acronexus.entity.SeatingArrangementStudent;
import com.acronexus.entity.Student;
import com.acronexus.entity.ClassSubject;
import com.acronexus.entity.StudentEnrollment;
import com.acronexus.repository.ClassSubjectRepository;
import com.acronexus.repository.StudentEnrollmentRepository;
import com.acronexus.repository.ExaminationAttendanceRepository;
import com.acronexus.repository.ExaminationRepository;
import com.acronexus.repository.SeatingArrangementRepository;
import com.acronexus.repository.StudentRepository;
import com.acronexus.service.ExaminationAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExaminationAttendanceServiceImpl implements ExaminationAttendanceService {

    private final ExaminationAttendanceRepository attendanceRepository;
    private final ExaminationRepository examinationRepository;
    private final SeatingArrangementRepository seatingArrangementRepository;
    private final StudentRepository studentRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ExaminationAttendanceDto> getAttendanceForExamination(UUID examinationId) {
        return attendanceRepository.findByExaminationId(examinationId).stream()
                .map(a -> new ExaminationAttendanceDto(
                        a.getStudent().getId(), 
                        a.getIsPresent(), 
                        a.getExamDate(), 
                        a.getClassSubject() != null ? a.getClassSubject().getId() : null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveAttendanceForExamination(UUID examinationId, ExaminationAttendanceSaveRequestDto requestDto) {
        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new RuntimeException("Examination not found"));

        java.time.LocalDate examDate = requestDto.getExamDate();
        if (examDate == null) {
            throw new RuntimeException("Exam date is required for saving attendance.");
        }

        java.util.Map<UUID, UUID> sectionSubjectMap = requestDto.getSectionSubjectMap() != null 
            ? requestDto.getSectionSubjectMap() 
            : java.util.Collections.emptyMap();

        for (ExaminationAttendanceDto dto : requestDto.getAttendanceList()) {
            Student student = studentRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Student not found: " + dto.getStudentId()));

            StudentEnrollment enrollment = studentEnrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(dto.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Active student enrollment not found for student " + dto.getStudentId()));

            UUID classId = enrollment.getAcroClass().getId();
            UUID classSubjectId = sectionSubjectMap.get(classId);

            if (classSubjectId == null) {
                throw new RuntimeException("No ClassSubject mapping provided for student's section " + classId);
            }

            ClassSubject classSubject = classSubjectRepository.findById(classSubjectId)
                    .orElseThrow(() -> new RuntimeException("ClassSubject not found: " + classSubjectId));
                    
            if (!classSubject.getAcroClass().getId().equals(classId)) {
                throw new RuntimeException("ClassSubject " + classSubjectId + " does not belong to student's section " + classId);
            }
            
            // Check if class is part of examination's targeted classes
            if (examination.getClasses().stream().noneMatch(c -> c.getId().equals(classId))) {
                throw new RuntimeException("Student's section " + classId + " is not targeted by this examination.");
            }

            // Exact match identity
            Optional<ExaminationAttendance> existing = attendanceRepository.findByExaminationIdAndStudentIdAndExamDateAndClassSubjectId(
                    examinationId, dto.getStudentId(), examDate, classSubjectId);
            
            if (existing.isPresent()) {
                ExaminationAttendance attendance = existing.get();
                attendance.setIsPresent(dto.getIsPresent());
                attendanceRepository.save(attendance);
            } else {
                ExaminationAttendance newAttendance = new ExaminationAttendance();
                newAttendance.setExamination(examination);
                newAttendance.setStudent(student);
                newAttendance.setIsPresent(dto.getIsPresent());
                newAttendance.setExamDate(examDate);
                newAttendance.setClassSubject(classSubject);
                attendanceRepository.save(newAttendance);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.acronexus.dto.ExaminationAttendanceSubjectDto> getAttendanceForClassSubject(UUID classSubjectId) {
        return attendanceRepository.findByClassSubjectId(classSubjectId).stream()
                .map(a -> new com.acronexus.dto.ExaminationAttendanceSubjectDto(
                        a.getStudent().getId(),
                        a.getStudent().getUser() != null ? a.getStudent().getUser().getFirstName() + " " + a.getStudent().getUser().getLastName() : "Unknown Student",
                        a.getStudent().getEnrollmentNo() != null ? a.getStudent().getEnrollmentNo() : "N/A",
                        a.getStudent().getUser() != null ? a.getStudent().getUser().getProfilePictureUrl() : null,
                        a.getIsPresent(),
                        a.getExamDate(),
                        a.getExamination().getId(),
                        a.getExamination().getName(),
                        a.getExamination().getType() != null ? a.getExamination().getType().toString() : "EXAM",
                        a.getClassSubject() != null ? a.getClassSubject().getId() : null
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAttendanceContext(UUID examinationId, java.time.LocalDate examDate, UUID classSubjectId) {
        List<ExaminationAttendance> records = attendanceRepository.findByExaminationId(examinationId);
        List<ExaminationAttendance> toDelete = records.stream().filter(a -> {
            if (examDate == null) {
                return a.getExamDate() == null;
            } else {
                if (!examDate.equals(a.getExamDate())) return false;
                if (classSubjectId == null) {
                    return a.getClassSubject() == null;
                } else {
                    return a.getClassSubject() != null && classSubjectId.equals(a.getClassSubject().getId());
                }
            }
        }).collect(Collectors.toList());
        attendanceRepository.deleteAll(toDelete);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<java.time.LocalDate> getAvailableAttendanceDates(UUID examinationId, UUID classSubjectId) {
        return attendanceRepository.findDistinctExamDatesByContext(examinationId, classSubjectId);
    }
}
