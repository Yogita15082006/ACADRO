package com.acronexus.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacultyReportRowDto {
    private UUID userId;
    private String employeeId;
    private String facultyName;
    private String department;
    private String additionalDepartments;
    private String designation;
    private String qualification;
    private String specialization;
    private String experience;
    private LocalDate joiningDate;
    private String officialEmail;
    private String phone;
    private String whatsappNumber;
    private String coordinatorResponsibility;
    private String assignedClasses;
    private String academicYears;
    private String semesters;
    private String assignedSubjects;
    private Integer overallAttendance;
    private Long classesScheduled;
    private Long classesConducted;
    private Long classesMissed;
    private Long holidaySessions;
    private Integer eventsCreated;
    private Integer noticesPublished;
    private Integer quizzesCreated;
    private Integer assignmentsCreated;
    private Integer examinationActivities;
    private Integer examCoordinatorAssignments;
    private Integer facultyManagementAssignedTasks;
}
