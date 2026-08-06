package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "attendance_session")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AttendanceSession extends BaseAuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_subject_id", nullable = false)
    private ClassSubject classSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(nullable = false)
    private String type; // e.g. "Lecture", "Lab", "Tutorial"

    @Column(nullable = false)
    private String lectureNumber;
    
    private String topic;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String duration; // e.g., "60 Mins"

    @Column(nullable = false, unique = true)
    private String code; // The attendance code e.g., "JAVA24IT"

    private Boolean requireVerification = false;
    
    private String verificationQuestion;
    
    private String expectedAnswer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceSessionStatus status;

    private Integer presentCount = 0;
    private Integer absentCount = 0;
    private Integer totalStudents = 0;
    
    private Integer uniqueCodeCount;
    
    private Boolean isSystemGenerated = false;
    
    @Column(columnDefinition = "TEXT")
    private String facultyReason;


    public ClassSubject getClassSubject() {
        return this.classSubject;
    }
    public void setClassSubject(ClassSubject classSubject) {
        this.classSubject = classSubject;
    }

    public Faculty getFaculty() {
        return this.faculty;
    }
    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public String getType() {
        return this.type;
    }
    public void setType(String type) {
        this.type = type;
    }

    public String getLectureNumber() {
        return this.lectureNumber;
    }
    public void setLectureNumber(String lectureNumber) {
        this.lectureNumber = lectureNumber;
    }

    public LocalDate getDate() {
        return this.date;
    }
    public void setDate(LocalDate date) {
        this.date = date;
    }

    public LocalTime getStartTime() {
        return this.startTime;
    }
    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return this.endTime;
    }
    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getDuration() {
        return this.duration;
    }
    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getCode() {
        return this.code;
    }
    public void setCode(String code) {
        this.code = code;
    }

    public Boolean getRequireVerification() {
        return this.requireVerification;
    }
    public void setRequireVerification(Boolean requireVerification) {
        this.requireVerification = requireVerification;
    }

    public String getVerificationQuestion() {
        return this.verificationQuestion;
    }
    public void setVerificationQuestion(String verificationQuestion) {
        this.verificationQuestion = verificationQuestion;
    }

    public String getExpectedAnswer() {
        return this.expectedAnswer;
    }
    public void setExpectedAnswer(String expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }

    public AttendanceSessionStatus getStatus() {
        return this.status;
    }
    public void setStatus(AttendanceSessionStatus status) {
        this.status = status;
    }

    public Integer getPresentCount() {
        return this.presentCount;
    }
    public void setPresentCount(Integer presentCount) {
        this.presentCount = presentCount;
    }

    public Integer getAbsentCount() {
        return this.absentCount;
    }
    public void setAbsentCount(Integer absentCount) {
        this.absentCount = absentCount;
    }

    public Integer getTotalStudents() {
        return this.totalStudents;
    }
    public void setTotalStudents(Integer totalStudents) {
        this.totalStudents = totalStudents;
    }

    public Integer getUniqueCodeCount() {
        return this.uniqueCodeCount;
    }
    public void setUniqueCodeCount(Integer uniqueCodeCount) {
        this.uniqueCodeCount = uniqueCodeCount;
    }

    public Boolean getIsSystemGenerated() {
        return this.isSystemGenerated;
    }
    public void setIsSystemGenerated(Boolean isSystemGenerated) {
        this.isSystemGenerated = isSystemGenerated;
    }

    public String getFacultyReason() {
        return this.facultyReason;
    }
    public void setFacultyReason(String facultyReason) {
        this.facultyReason = facultyReason;
    }
}
