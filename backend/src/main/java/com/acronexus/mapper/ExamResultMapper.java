package com.acronexus.mapper;

import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import com.acronexus.entity.ExamResult;
import com.acronexus.entity.Examination;
import com.acronexus.entity.Student;
import com.acronexus.entity.Subject;
import org.springframework.stereotype.Component;

@Component
public class ExamResultMapper {
    
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
        return dto;
    }
}
