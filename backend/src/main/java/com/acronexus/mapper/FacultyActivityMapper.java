package com.acronexus.mapper;

import com.acronexus.dto.FacultyActivityRequestDto;
import com.acronexus.dto.FacultyActivityResponseDto;
import com.acronexus.entity.FacultyActivity;
import com.acronexus.repository.ClassSubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FacultyActivityMapper {
    
    private final ClassSubjectRepository classSubjectRepository;
    private final com.acronexus.repository.AttendanceSessionRepository attendanceSessionRepository;

    public FacultyActivity toEntity(FacultyActivityRequestDto dto) {
        if (dto == null) return null;
        FacultyActivity entity = new FacultyActivity();
        entity.setDate(dto.getDate());
        
        if (dto.getStatus() != null) {
            try {
                entity.setStatus(com.acronexus.entity.FacultyActivityStatus.valueOf(dto.getStatus()));
            } catch (Exception e) {}
        }
        entity.setReason(dto.getReason());
        
        if (dto.getClassSubjectId() != null) {
            classSubjectRepository.findById(dto.getClassSubjectId()).ifPresent(entity::setClassSubject);
        }
        
        return entity;
    }

    public FacultyActivityResponseDto toDto(FacultyActivity entity) {
        if (entity == null) return null;
        FacultyActivityResponseDto dto = new FacultyActivityResponseDto();
        dto.setId(entity.getId());
        dto.setDate(entity.getDate());
        if (entity.getStatus() != null) {
            dto.setStatus(entity.getStatus().name());
        }
        dto.setReason(entity.getReason());
        dto.setLectureNumber(entity.getLectureNumber());
        if (entity.getClassSubject() != null) {
            dto.setClassSubjectId(entity.getClassSubject().getId());
            if (entity.getClassSubject().getSubject() != null) {
                dto.setSubjectName(entity.getClassSubject().getSubject().getName());
            } else if (entity.getClassSubject().getSyllabusSubject() != null) {
                dto.setSubjectName(entity.getClassSubject().getSyllabusSubject().getSubjectName());
            }

            if (entity.getClassSubject().getAcroClass() != null) {
                dto.setClassName(entity.getClassSubject().getAcroClass().getName());
            } else if (entity.getClassSubject().getSyllabusSubject() != null && entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus() != null) {
                dto.setClassName(entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus().getClassName());
            }

            if (entity.getClassSubject().getSemester() != null) {
                dto.setSemester(String.valueOf(entity.getClassSubject().getSemester().getSemesterNumber()));
            } else if (entity.getClassSubject().getSyllabusSubject() != null && entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus() != null) {
                dto.setSemester(entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus().getSemester());
            }

            if (entity.getClassSubject().getAcademicYear() != null) {
                dto.setAcademicYear(entity.getClassSubject().getAcademicYear().getYear());
            } else if (entity.getClassSubject().getSyllabusSubject() != null && entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus() != null) {
                dto.setAcademicYear(entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus().getAcademicYear());
            }

            if (entity.getClassSubject().getSyllabusSubject() != null && 
                entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus() != null) {
                dto.setBatch(entity.getClassSubject().getSyllabusSubject().getAcademicSyllabus().getBatch());
            }
            if (entity.getSessionId() != null) {
                java.util.Optional<com.acronexus.entity.AttendanceSession> sessionOpt = attendanceSessionRepository.findById(entity.getSessionId());
                if (sessionOpt.isPresent()) {
                    com.acronexus.entity.AttendanceSession session = sessionOpt.get();
                    dto.setSessionId(session.getId());
                    dto.setTopic(session.getTopic());
                    dto.setTotalStudents(session.getTotalStudents());
                    dto.setPresentCount(session.getPresentCount());
                    dto.setAbsentCount(session.getAbsentCount());
                }
            } else if (entity.getFaculty() != null) {
                // Fallback for older records
                java.util.Optional<com.acronexus.entity.AttendanceSession> sessionOpt = attendanceSessionRepository.findTopByFacultyIdAndClassSubjectIdAndDateOrderByCreatedAtDesc(
                    entity.getFaculty().getId(), entity.getClassSubject().getId(), entity.getDate()
                );
                if (sessionOpt.isPresent()) {
                    com.acronexus.entity.AttendanceSession session = sessionOpt.get();
                    dto.setSessionId(session.getId());
                    dto.setTopic(session.getTopic());
                    dto.setTotalStudents(session.getTotalStudents());
                    dto.setPresentCount(session.getPresentCount());
                    dto.setAbsentCount(session.getAbsentCount());
                }
            }
        }
        return dto;
    }
}
