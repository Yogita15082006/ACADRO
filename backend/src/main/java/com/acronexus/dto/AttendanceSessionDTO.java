package com.acronexus.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class AttendanceSessionDTO {
    private UUID id;
    private UUID classSubjectId;
    private UUID facultyId;
    private String subjectName;
    private String facultyName;
    private String academicYear;
    private String department;
    private String className;
    private String type;
    private String lectureNumber;
    private String topic;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String duration;
    private String code;
    private Boolean requireVerification;
    private String verificationQuestion;
    private String expectedAnswer;
    private String status;
    private Integer presentCount;
    private Integer absentCount;
    private Integer totalStudents;
    private Integer uniqueCodeCount;
    private java.time.Instant createdAt;
    private Boolean isSystemGenerated;
    private String facultyReason;


    public UUID getId() {
        return this.id;
    }
    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getClassSubjectId() {
        return this.classSubjectId;
    }
    public void setClassSubjectId(UUID classSubjectId) {
        this.classSubjectId = classSubjectId;
    }

    public UUID getFacultyId() {
        return this.facultyId;
    }
    public void setFacultyId(UUID facultyId) {
        this.facultyId = facultyId;
    }

    public String getSubjectName() {
        return this.subjectName;
    }
    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getFacultyName() {
        return this.facultyName;
    }
    public void setFacultyName(String facultyName) {
        this.facultyName = facultyName;
    }

    public String getAcademicYear() {
        return this.academicYear;
    }
    public void setAcademicYear(String academicYear) {
        this.academicYear = academicYear;
    }

    public String getDepartment() {
        return this.department;
    }
    public void setDepartment(String department) {
        this.department = department;
    }

    public String getClassName() {
        return this.className;
    }
    public void setClassName(String className) {
        this.className = className;
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

    public String getStatus() {
        return this.status;
    }
    public void setStatus(String status) {
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

    public java.time.Instant getCreatedAt() {
        return this.createdAt;
    }
    public void setCreatedAt(java.time.Instant createdAt) {
        this.createdAt = createdAt;
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
