package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class MarkAttendanceRequest {
    private UUID studentId;
    private String attendanceCode;
    private String verificationAnswer;


    public UUID getStudentId() {
        return this.studentId;
    }
    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public String getAttendanceCode() {
        return this.attendanceCode;
    }
    public void setAttendanceCode(String attendanceCode) {
        this.attendanceCode = attendanceCode;
    }

    public String getVerificationAnswer() {
        return this.verificationAnswer;
    }
    public void setVerificationAnswer(String verificationAnswer) {
        this.verificationAnswer = verificationAnswer;
    }
}
