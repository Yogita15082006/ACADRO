package com.acronexus.service;

import com.acronexus.dto.BulkAttendanceRequestDto;
import com.acronexus.dto.CoordinatorScheduleDto;
import com.acronexus.dto.CoordinatorStudentDto;
import java.time.LocalDate;
import java.util.List;

public interface CoordinatorAttendanceService {
    com.acronexus.dto.CoordinatorSectionStudentsDto getMyStudents();
    CoordinatorScheduleDto getScheduleForDate(LocalDate date);
    void addBulkAttendance(BulkAttendanceRequestDto request);
}
