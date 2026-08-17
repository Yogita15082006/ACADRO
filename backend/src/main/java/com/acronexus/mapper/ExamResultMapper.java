package com.acronexus.mapper;

import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import com.acronexus.entity.ExamResult;
import com.acronexus.entity.Examination;
import com.acronexus.entity.Student;
import com.acronexus.entity.Subject;
import org.springframework.stereotype.Component;

import com.acronexus.repository.StudentEnrollmentRepository;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class ExamResultMapper {
    
    @Autowired
    private StudentEnrollmentRepository enrollmentRepository;

    public ExamResult toEntity(ExamResultRequestDto dto) {
        if (dto == null) return null;
        ExamResult entity = new ExamResult();
        if (dto.getExaminationId() != null) {
            Examination examination = new Examination();
            examination.setId(dto.getExaminationId());
            entity.setExamination(examination);
        }
        if (dto.getStudentId() != null) {
            Student student = new Student();
            student.setId(dto.getStudentId());
            entity.setStudent(student);
        }
        if (dto.getSubjectId() != null) {
            Subject subject = new Subject();
            subject.setId(dto.getSubjectId());
            entity.setSubject(subject);
        }
        entity.setMarksObtained(dto.getMarksObtained());
        entity.setMaxMarks(dto.getMaxMarks());
        entity.setGrade(dto.getGrade());
        entity.setRemarks(dto.getRemarks());
        return entity;
    }

    public ExamResultResponseDto toDto(ExamResult entity) {
        if (entity == null) return null;
        ExamResultResponseDto dto = new ExamResultResponseDto();
        if (entity.getId() != null) {
            dto.setId(entity.getId());
        }
        if (entity.getExamination() != null) {
            dto.setExaminationId(entity.getExamination().getId());
            dto.setExaminationName(entity.getExamination().getName());
        }
        if (entity.getStudent() != null) {
            dto.setStudentId(entity.getStudent().getId());
            dto.setEnrollmentNo(entity.getStudent().getEnrollmentNo());
            if (entity.getStudent().getUser() != null) {
                dto.setStudentName(entity.getStudent().getUser().getFirstName() + " " + entity.getStudent().getUser().getLastName());
            }
        }
        if (entity.getSubject() != null) {
            dto.setSubjectId(entity.getSubject().getId());
            dto.setSubjectName(entity.getSubject().getName());
            dto.setSubjectCode(entity.getSubject().getCode());
        }
        dto.setMarksObtained(entity.getMarksObtained());
        dto.setMaxMarks(entity.getMaxMarks());
        dto.setGrade(entity.getGrade());
        dto.setRemarks(entity.getRemarks());
        dto.setIsPublished(entity.getIsPublished());
        
        if (entity.getClassName() != null && !entity.getClassName().isEmpty()) {
            dto.setClassName(entity.getClassName());
        } else if (entity.getStudent() != null) {
            String tempClassName = entity.getStudent().getSection();
            if (tempClassName == null || tempClassName.isEmpty()) {
                tempClassName = entity.getStudent().getCourse();
            } else if (entity.getStudent().getCourse() != null) {
                tempClassName = entity.getStudent().getCourse() + "-" + tempClassName;
            }
            final String classNameFallback = tempClassName;
            
            if (entity.getExamination() != null && entity.getExamination().getAcademicYear() != null && entity.getExamination().getSemester() != null) {
                enrollmentRepository.findFirstByStudentIdAndAcademicYearIdAndSemesterIdOrderByIdDesc(
                        entity.getStudent().getId(), 
                        entity.getExamination().getAcademicYear().getId(),
                        entity.getExamination().getSemester().getId()
                ).ifPresentOrElse(enr -> {
                    if (enr.getAcroClass() != null) {
                        dto.setClassName(enr.getAcroClass().getName() + (enr.getAcroClass().getSection() != null ? "-" + enr.getAcroClass().getSection() : ""));
                    } else {
                        dto.setClassName(classNameFallback);
                    }
                }, () -> dto.setClassName(classNameFallback));
            } else {
                enrollmentRepository.findFirstByStudentIdAndIsActiveTrueOrderByCreatedAtDesc(entity.getStudent().getId())
                .ifPresentOrElse(enr -> {
                    if (enr.getAcroClass() != null) {
                        dto.setClassName(enr.getAcroClass().getName() + (enr.getAcroClass().getSection() != null ? "-" + enr.getAcroClass().getSection() : ""));
                    } else {
                        dto.setClassName(classNameFallback);
                    }
                }, () -> dto.setClassName(classNameFallback));
            }
        }
        
        return dto;
    }
}
