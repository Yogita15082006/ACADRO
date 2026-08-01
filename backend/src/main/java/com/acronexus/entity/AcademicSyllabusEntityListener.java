package com.acronexus.entity;

import com.acronexus.config.SpringContext;
import com.acronexus.service.ClassSubjectService;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;

public class AcademicSyllabusEntityListener {

    @PostPersist
    @PostUpdate
    public void onPostPersistOrUpdate(AcademicSyllabus syllabus) {
        try {
            ClassSubjectService service = SpringContext.getBean(ClassSubjectService.class);
            if (service != null) {
                service.syncAllClassSubjectsWithSyllabus(syllabus);
            }
        } catch (Exception ignored) {
            // Do not affect transaction if service is unavailable
        }
    }
}
