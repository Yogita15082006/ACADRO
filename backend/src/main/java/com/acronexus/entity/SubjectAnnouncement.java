package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subject_announcements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SubjectAnnouncement extends BaseAuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id", nullable = false)
    private ClassSubject classSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(name = "faculty_name")
    private String facultyName;

    private String department;
    private String batch;

    @Column(name = "academic_year")
    private String year;

    private String semester;

    @Column(name = "class_name")
    private String className;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private String priority = "Normal";

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    public ClassSubject getClassSubject() { return this.classSubject; }
    public void setClassSubject(ClassSubject classSubject) { this.classSubject = classSubject; }

    public Subject getSubject() { return this.subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

    public Faculty getFaculty() { return this.faculty; }
    public void setFaculty(Faculty faculty) { this.faculty = faculty; }

    public String getFacultyName() { return this.facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getDepartment() { return this.department; }
    public void setDepartment(String department) { this.department = department; }

    public String getBatch() { return this.batch; }
    public void setBatch(String batch) { this.batch = batch; }

    public String getYear() { return this.year; }
    public void setYear(String year) { this.year = year; }

    public String getSemester() { return this.semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getClassName() { return this.className; }
    public void setClassName(String className) { this.className = className; }

    public String getTitle() { return this.title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return this.message; }
    public void setMessage(String message) { this.message = message; }

    public String getPriority() { return this.priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Boolean getIsDeleted() { return this.isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}
