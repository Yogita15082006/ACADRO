package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectAnnouncementResponseDto {
    private UUID id;
    private UUID classSubjectId;
    private UUID subjectId;
    private UUID facultyId;
    private String facultyName;
    private String postedBy; // Alias for UI compatibility
    private String department;
    private String batch;
    private String year;
    private String semester;
    private String className;
    private String title;
    private String message;
    private String description; // Alias for UI compatibility
    private String priority;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;
    private String publishDate; // Formatted date string for UI compatibility
    private Boolean isDeleted;

    public UUID getId() { return this.id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getClassSubjectId() { return this.classSubjectId; }
    public void setClassSubjectId(UUID classSubjectId) { this.classSubjectId = classSubjectId; }
    public UUID getSubjectId() { return this.subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public UUID getFacultyId() { return this.facultyId; }
    public void setFacultyId(UUID facultyId) { this.facultyId = facultyId; }
    public String getFacultyName() { return this.facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }
    public String getPostedBy() { return this.postedBy; }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }
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
    public String getDescription() { return this.description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return this.priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public ZonedDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getPublishDate() { return this.publishDate; }
    public void setPublishDate(String publishDate) { this.publishDate = publishDate; }
    public Boolean getIsDeleted() { return this.isDeleted; }
    public void setIsDeleted(Boolean isDeleted) { this.isDeleted = isDeleted; }
}
