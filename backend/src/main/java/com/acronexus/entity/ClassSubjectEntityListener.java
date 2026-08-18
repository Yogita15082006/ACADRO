package com.acronexus.entity;

import com.acronexus.config.SpringContext;
import com.acronexus.service.ClassSubjectService;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

public class ClassSubjectEntityListener {

    @PrePersist
    @PreUpdate
    public void onPrePersistOrUpdate(ClassSubject classSubject) {
        try {
            if (Boolean.FALSE.equals(classSubject.getIsActive())) {
                return;
            }
            ClassSubjectService service = SpringContext.getBean(ClassSubjectService.class);
            if (service != null && classSubject.getSyllabusSubject() == null) {
                service.linkSyllabusToClassSubject(classSubject);
            }
        } catch (Exception ignored) {
            // Do not disrupt entity persistence if service is not yet available
        }
    }
}
