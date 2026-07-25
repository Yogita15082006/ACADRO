package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_attendance")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StudentAttendance extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id", nullable = false)
    private ClassSubject classSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private java.time.LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "marked_by")
    private User markedBy;



    public ClassSubject getClassSubject() {
        return this.classSubject;
    }
    public void setClassSubject(ClassSubject classSubject) {
        this.classSubject = classSubject;
    }

    public Student getStudent() {
        return this.student;
    }
    public void setStudent(Student student) {
        this.student = student;
    }

    public java.time.LocalDate getDate() {
        return this.date;
    }
    public void setDate(java.time.LocalDate date) {
        this.date = date;
    }

    public AttendanceStatus getStatus() {
        return this.status;
    }
    public void setStatus(AttendanceStatus status) {
        this.status = status;
    }

    public AttendanceSession getSession() {
        return this.session;
    }
    public void setSession(AttendanceSession session) {
        this.session = session;
    }

    public User getMarkedBy() {
        return this.markedBy;
    }
    public void setMarkedBy(User markedBy) {
        this.markedBy = markedBy;
    }
}
