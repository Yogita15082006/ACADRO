package com.acronexus.entity;

import com.acronexus.config.SpringContext;
import com.acronexus.service.ClassSubjectService;
import jakarta.persistence.PostPersist;
import jakarta.persistence.PostUpdate;

public class AcademicSyllabusEntityListener {

    @PostPersist
    @PostUpdate
    public void onPostPersistOrUpdate(AcademicSyllabus syllabus) {
        // Removed mid-flush repository queries to prevent PostgreSQL transaction abortions during OneToMany child inserts.
        // Syllabus card matching synchronization is executed explicitly after save and flush in AcademicResourceServiceImpl.
    }
}
