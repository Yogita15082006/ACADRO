package com.acronexus.service.impl;

import com.acronexus.dto.ExaminationAttendanceDto;
import com.acronexus.dto.ExaminationAttendanceSaveRequestDto;
import com.acronexus.entity.Examination;
import com.acronexus.entity.ExaminationAttendance;
import com.acronexus.entity.SeatingArrangement;
import com.acronexus.entity.SeatingArrangementStudent;
import com.acronexus.entity.Student;
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

    @Override
    @Transactional(readOnly = true)
    public List<ExaminationAttendanceDto> getAttendanceForExamination(UUID examinationId) {
        return attendanceRepository.findByExaminationId(examinationId).stream()
                .map(a -> new ExaminationAttendanceDto(a.getStudent().getId(), a.getIsPresent()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveAttendanceForExamination(UUID examinationId, ExaminationAttendanceSaveRequestDto requestDto) {
        Examination examination = examinationRepository.findById(examinationId)
                .orElseThrow(() -> new RuntimeException("Examination not found"));

        SeatingArrangement seating = seatingArrangementRepository.findByExaminationIdAndIsDeletedFalse(examinationId)
                .orElseThrow(() -> new RuntimeException("No active seating arrangement found for this examination"));

        // Get all valid student IDs from the seating arrangement
        Set<UUID> validStudentIds = seating.getRoomAllocations().stream()
                .flatMap(room -> room.getStudents().stream())
                .map(SeatingArrangementStudent::getStudent)
                .map(Student::getId)
                .collect(Collectors.toSet());

        for (ExaminationAttendanceDto dto : requestDto.getAttendanceList()) {
            if (!validStudentIds.contains(dto.getStudentId())) {
                throw new RuntimeException("Student " + dto.getStudentId() + " is not part of the active seating arrangement");
            }

            Optional<ExaminationAttendance> existing = attendanceRepository.findByExaminationIdAndStudentId(examinationId, dto.getStudentId());
            
            if (existing.isPresent()) {
                ExaminationAttendance attendance = existing.get();
                attendance.setIsPresent(dto.getIsPresent());
                attendanceRepository.save(attendance);
            } else {
                Student student = studentRepository.findById(dto.getStudentId())
                        .orElseThrow(() -> new RuntimeException("Student not found"));
                        
                ExaminationAttendance newAttendance = new ExaminationAttendance();
                newAttendance.setExamination(examination);
                newAttendance.setStudent(student);
                newAttendance.setIsPresent(dto.getIsPresent());
                attendanceRepository.save(newAttendance);
            }
        }
    }
}
