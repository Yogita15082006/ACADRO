package com.acronexus.service.impl;

import com.acronexus.dto.ExamResultRequestDto;
import com.acronexus.dto.ExamResultResponseDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.mapper.ExamResultMapper;
import com.acronexus.security.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExamResultServiceImplTest {

    @Mock
    private ExamResultRepository repository;

    @Mock
    private ExamResultMapper mapper;

    @Mock
    private ExamResultsHistoryRepository historyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ExaminationRepository examinationRepository;

    @Mock
    private ExaminationAttendanceRepository examinationAttendanceRepository;

    @Mock
    private StudentEnrollmentRepository studentEnrollmentRepository;

    @Mock
    private ClassSubjectRepository classSubjectRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ExaminationEligibilityListRepository eligibilityListRepository;

    @Mock
    private com.acronexus.service.ExaminationService examinationService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ExamResultServiceImpl examResultService;


    private User facultyUser;
    private ExamResult examResult;

    @BeforeEach
    void setUp() {
        facultyUser = new User();
        facultyUser.setId(UUID.randomUUID());
        facultyUser.setRole(UserRole.FACULTY);

        examResult = new ExamResult();
        examResult.setId(UUID.randomUUID());
        examResult.setMarksObtained(BigDecimal.valueOf(50));
        examResult.setMaxMarks(BigDecimal.valueOf(100));
        examResult.setGrade("C");
    }

    private void mockSecurityContext(User user) {
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.getReferenceById(user.getId())).thenReturn(user);
    }

    @Test
    void updateExamResult_GeneratesHistoryRecord_WhenMarksChange() {
        mockSecurityContext(facultyUser);
        
        when(repository.findById(examResult.getId())).thenReturn(Optional.of(examResult));
        
        ExamResultResponseDto mockResponse = new ExamResultResponseDto();
        mockResponse.setId(examResult.getId());
        mockResponse.setMarksObtained(BigDecimal.valueOf(75));
        when(mapper.toDto(any(ExamResult.class))).thenReturn(mockResponse);
        when(repository.save(any(ExamResult.class))).thenReturn(examResult);

        ExamResultRequestDto request = new ExamResultRequestDto();
        request.setMarksObtained(BigDecimal.valueOf(75));
        request.setMaxMarks(BigDecimal.valueOf(100));
        request.setModificationReason("Re-evaluation");

        ExamResultResponseDto response = examResultService.update(examResult.getId(), request);

        ArgumentCaptor<ExamResultsHistory> historyCaptor = ArgumentCaptor.forClass(ExamResultsHistory.class);
        verify(historyRepository).save(historyCaptor.capture());

        ExamResultsHistory savedHistory = historyCaptor.getValue();
        assertEquals(examResult, savedHistory.getResult());
        assertEquals(BigDecimal.valueOf(50), savedHistory.getPreviousMarksObtained());
        assertEquals(BigDecimal.valueOf(75), savedHistory.getNewMarksObtained());
        assertEquals("Re-evaluation", savedHistory.getModificationReason());
        assertEquals(facultyUser, savedHistory.getModifiedBy());

        assertEquals(BigDecimal.valueOf(75), response.getMarksObtained());
    }

    @Test
    void getStudentCategorySummary_AccuratelyClassifiesStudents() {
        UUID examId = UUID.randomUUID();
        UUID classSubjectId = UUID.randomUUID();
        java.time.LocalDate examDate = java.time.LocalDate.of(2026, 11, 10);

        Examination examination = new Examination();
        examination.setId(examId);
        examination.setName("Mid Term Exam");
        when(examinationRepository.findById(examId)).thenReturn(Optional.of(examination));

        AcroClass acroClass = new AcroClass();
        acroClass.setId(UUID.randomUUID());
        acroClass.setName("CS-3A");
        acroClass.setSection("A");

        ClassSubject classSubject = new ClassSubject();
        classSubject.setId(classSubjectId);
        classSubject.setAcroClass(acroClass);
        when(classSubjectRepository.findById(classSubjectId)).thenReturn(Optional.of(classSubject));

        // 3 Students:
        // Student 1: Eligible and Appeared
        Student s1 = createMockStudent("0827CS211001", "Alice", "Sharma");
        StudentEnrollment enr1 = new StudentEnrollment();
        enr1.setStudent(s1);
        enr1.setAcroClass(acroClass);

        // Student 2: Eligible but Not Appeared
        Student s2 = createMockStudent("0827CS211002", "Bob", "Verma");
        StudentEnrollment enr2 = new StudentEnrollment();
        enr2.setStudent(s2);
        enr2.setAcroClass(acroClass);

        // Student 3: Not Eligible
        Student s3 = createMockStudent("0827CS211003", "Charlie", "Gupta");
        StudentEnrollment enr3 = new StudentEnrollment();
        enr3.setStudent(s3);
        enr3.setAcroClass(acroClass);

        when(studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClass.getId()))
                .thenReturn(java.util.List.of(enr1, enr2, enr3));

        // Mock saved eligibility list
        ExaminationEligibilityList elgList = new ExaminationEligibilityList();
        ExaminationEligibilityStudent ees1 = new ExaminationEligibilityStudent();
        ees1.setStudent(s1);
        ees1.setIsEligible(true);
        ees1.setOverallAttendance(85.0);

        ExaminationEligibilityStudent ees2 = new ExaminationEligibilityStudent();
        ees2.setStudent(s2);
        ees2.setIsEligible(true);
        ees2.setOverallAttendance(80.0);

        ExaminationEligibilityStudent ees3 = new ExaminationEligibilityStudent();
        ees3.setStudent(s3);
        ees3.setIsEligible(false);
        ees3.setReason("Attendance Shortage (52%)");
        ees3.setOverallAttendance(52.0);

        elgList.setStudents(java.util.List.of(ees1, ees2, ees3));
        when(eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(examId))
                .thenReturn(java.util.List.of(elgList));

        // Mock attendance: s1 is present, s2 is absent in attendance sheet
        ExaminationAttendance att1 = new ExaminationAttendance();
        att1.setStudent(s1);
        att1.setIsPresent(true);

        ExaminationAttendance att2 = new ExaminationAttendance();
        att2.setStudent(s2);
        att2.setIsPresent(false);

        when(examinationAttendanceRepository.findByExaminationIdAndExamDateAndClassSubjectId(examId, examDate, classSubjectId))
                .thenReturn(java.util.List.of(att1, att2));

        // Mock results: s1 has a result, s2 has none
        ExamResult res1 = new ExamResult();
        res1.setStudent(s1);
        res1.setMarksObtained(BigDecimal.valueOf(88));
        when(repository.findByExaminationIdAndExamDateAndClassSubjectId(examId, examDate, classSubjectId))
                .thenReturn(java.util.List.of(res1));

        com.acronexus.dto.ExamStudentCategorySummaryDto summary = 
                examResultService.getStudentCategorySummary(examId, examDate, classSubjectId, null);

        assertNotNull(summary);
        assertEquals(3, summary.getTotalStudents());
        assertEquals(1, summary.getAppearedCount());
        assertEquals(1, summary.getEligibleNotAppearedCount());
        assertEquals(1, summary.getNotEligibleCount());

        assertEquals(1, summary.getAppearedStudents().size());
        assertEquals("0827CS211001", summary.getAppearedStudents().get(0).getEnrollmentNo());
        assertEquals("APPEARED", summary.getAppearedStudents().get(0).getCategory());
        assertEquals("PRESENT", summary.getAppearedStudents().get(0).getAppearanceStatus());
        assertTrue(summary.getAppearedStudents().get(0).getIsEligible());

        assertEquals(1, summary.getEligibleNotAppearedStudents().size());
        assertEquals("0827CS211002", summary.getEligibleNotAppearedStudents().get(0).getEnrollmentNo());
        assertEquals("ELIGIBLE_NOT_APPEARED", summary.getEligibleNotAppearedStudents().get(0).getCategory());
        assertEquals("ABSENT", summary.getEligibleNotAppearedStudents().get(0).getAppearanceStatus());
        assertTrue(summary.getEligibleNotAppearedStudents().get(0).getIsEligible());

        assertEquals(1, summary.getNotEligibleStudents().size());
        assertEquals("0827CS211003", summary.getNotEligibleStudents().get(0).getEnrollmentNo());
        assertEquals("NOT_ELIGIBLE", summary.getNotEligibleStudents().get(0).getCategory());
        assertFalse(summary.getNotEligibleStudents().get(0).getIsEligible());
        assertEquals("Attendance Shortage (52%)", summary.getNotEligibleStudents().get(0).getEligibilityReason());
    }

    @Test
    void exportCategorizedStudentsExcel_GeneratesValidExcelBytes() {
        UUID examId = UUID.randomUUID();
        UUID classSubjectId = UUID.randomUUID();
        java.time.LocalDate examDate = java.time.LocalDate.of(2026, 11, 10);

        Examination examination = new Examination();
        examination.setId(examId);
        when(examinationRepository.findById(examId)).thenReturn(Optional.of(examination));

        AcroClass acroClass = new AcroClass();
        acroClass.setId(UUID.randomUUID());
        acroClass.setName("CS-3A");

        ClassSubject classSubject = new ClassSubject();
        classSubject.setId(classSubjectId);
        classSubject.setAcroClass(acroClass);
        when(classSubjectRepository.findById(classSubjectId)).thenReturn(Optional.of(classSubject));

        Student s2 = createMockStudent("0827CS211002", "Bob", "Verma");
        StudentEnrollment enr2 = new StudentEnrollment();
        enr2.setStudent(s2);
        enr2.setAcroClass(acroClass);
        when(studentEnrollmentRepository.findByAcroClassIdAndIsActiveTrue(acroClass.getId()))
                .thenReturn(java.util.List.of(enr2));

        when(eligibilityListRepository.findByExaminationIdOrderByCreatedAtDesc(examId))
                .thenReturn(java.util.Collections.emptyList());
        com.acronexus.dto.ExaminationEligibilityStudentDto elgDto = com.acronexus.dto.ExaminationEligibilityStudentDto.builder()
                .id(UUID.randomUUID())
                .studentId(s2.getId())
                .name("Bob Verma")
                .enrollmentNumber("0827CS211002")
                .className("CS-3A")
                .overallAttendance(80.0)
                .isEligible(true)
                .build();
        when(examinationService.generateEligibilityList(eq(examId), any()))
                .thenReturn(java.util.List.of(elgDto));

        when(examinationAttendanceRepository.findByExaminationIdAndExamDateAndClassSubjectId(examId, examDate, classSubjectId))
                .thenReturn(java.util.Collections.emptyList());
        when(repository.findByExaminationIdAndExamDateAndClassSubjectId(examId, examDate, classSubjectId))
                .thenReturn(java.util.Collections.emptyList());

        byte[] excelBytes = examResultService.exportCategorizedStudentsExcel(examId, examDate, classSubjectId, null, "ELIGIBLE_NOT_APPEARED");

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);
    }

    private Student createMockStudent(String enrollmentNo, String firstName, String lastName) {
        Student s = new Student();
        s.setId(UUID.randomUUID());
        s.setEnrollmentNo(enrollmentNo);
        User u = new User();
        u.setId(UUID.randomUUID());
        u.setFirstName(firstName);
        u.setLastName(lastName);
        s.setUser(u);
        return s;
    }
}

