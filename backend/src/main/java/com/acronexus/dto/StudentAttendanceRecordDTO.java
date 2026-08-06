package com.acronexus.dto;

import lombok.Data;
import java.util.UUID;
import java.time.LocalTime;

@Data
public class StudentAttendanceRecordDTO {
    private UUID id;
    private UUID studentId;
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    private String enrollmentNumber;
    private String name;
    private String avatar;
    private String status;
    private String time;
    private String answer;
    private String verificationResult;
    private Integer uniqueCode;
    private String approvalSource;
    private String remarks;

    public UUID getStudentId() { return studentId; }
    public void setStudentId(UUID studentId) { this.studentId = studentId; }

    public String getEnrollmentNumber() { return enrollmentNumber; }
    public void setEnrollmentNumber(String enrollmentNumber) { this.enrollmentNumber = enrollmentNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getVerificationResult() { return verificationResult; }
    public void setVerificationResult(String verificationResult) { this.verificationResult = verificationResult; }

    public Integer getUniqueCode() { return uniqueCode; }
    public void setUniqueCode(Integer uniqueCode) { this.uniqueCode = uniqueCode; }

    public String getApprovalSource() { return approvalSource; }
    public void setApprovalSource(String approvalSource) { this.approvalSource = approvalSource; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
