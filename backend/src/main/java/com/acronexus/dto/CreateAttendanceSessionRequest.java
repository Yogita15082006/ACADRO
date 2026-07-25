package com.acronexus.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateAttendanceSessionRequest {
    private UUID classSubjectId;
    private String type;
    private String lectureNumber;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private String duration;
    private String code;
    private Boolean requireVerification;
    private String verificationQuestion;
    private String expectedAnswer;


    public UUID getClassSubjectId() {
        return this.classSubjectId;
    }
    public void setClassSubjectId(UUID classSubjectId) {
        this.classSubjectId = classSubjectId;
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
}
