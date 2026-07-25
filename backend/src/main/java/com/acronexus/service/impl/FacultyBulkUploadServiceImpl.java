package com.acronexus.service.impl;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.dto.UploadErrorDto;
import com.acronexus.dto.UploadStats;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.dto.AiFacultyValidationResultDto;
import com.acronexus.service.AiService;
import com.acronexus.service.FacultyBulkUploadService;
import com.acronexus.util.BulkUploadUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.io.Reader;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyBulkUploadServiceImpl implements FacultyBulkUploadService {

    private final BulkUploadRepository bulkUploadRepository;
    private final FileStorageRepository fileStorageRepository;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;
    private final AiService aiService;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final AcademicYearRepository academicYearRepository;
    private final AcroClassRepository acroClassRepository;

    @Override
    public BulkUploadResponseDto uploadFacultyList(MultipartFile file, UUID uploadedByUserId) {
        throw new UnsupportedOperationException("Direct file upload is deprecated. Use AI validation and JSON import.");
    }

    @Override
    public BulkUploadResponseDto importValidatedFaculties(List<Map<String, Object>> records, UUID uploadedByUserId) {
        Instant startTime = Instant.now();
        User uploadedBy = userRepository.findById(uploadedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("Uploader not found"));

        // Create BulkUpload entry
        BulkUpload bulkUpload = new BulkUpload();
        bulkUpload.setUploadType(UploadType.FACULTY_LIST);
        bulkUpload.setProcessingStatus(ProcessingStatus.PROCESSING);
        bulkUpload.setUploadedBy(uploadedBy);
        bulkUpload = bulkUploadRepository.save(bulkUpload);

        UploadStats stats = new UploadStats();

        if (records != null && !records.isEmpty()) {
            int rowNumber = 1;
            for (Map<String, Object> recordObj : records) {
                rowNumber++;
                stats.totalRecords++;
                
                try {
                    Map<String, String> recordMap = new HashMap<>();
                    for (Map.Entry<String, Object> entry : recordObj.entrySet()) {
                        recordMap.put(entry.getKey(), entry.getValue() != null ? entry.getValue().toString() : "");
                    }

                    String rawName = getFieldValue(recordMap, "facultyName", "name", "faculty", "fullName");
                    String rawEmployeeId = getFieldValue(recordMap, "employeeId", "empId", "employeeCode", "empCode");
                    String rawEmail = getFieldValue(recordMap, "collegeEmail", "email", "emailId", "collegeEmailId", "emailAddress");
                    String rawGender = getFieldValue(recordMap, "gender", "sex");
                    String rawRole = getFieldValue(recordMap, "role", "designation", "facultyRole");
                    String rawDepartment = getFieldValue(recordMap, "department", "dept", "branch");
                    String rawMobile = getFieldValue(recordMap, "mobileNumber", "phone", "mobile", "contact", "phoneNumber");
                    String rawJoiningDate = getFieldValue(recordMap, "joiningDate", "doj", "dateOfJoining");
                    String rawQualification = getFieldValue(recordMap, "qualification", "degree");
                    String rawExperience = getFieldValue(recordMap, "experience", "experienceYears", "exp");
                    String rawStatus = getFieldValue(recordMap, "status", "isActive", "active");

                    FacultyRowData rowData = new FacultyRowData(
                            rawName, rawEmployeeId, rawEmail, rawGender, rawRole, rawDepartment,
                            rawMobile, rawJoiningDate, rawQualification, rawExperience, rawStatus
                    );

                    log.info("[STEP 4 CONFIRM] Record {}: {}", rowNumber, rowData);
                    executeRowInTransaction(rowNumber, rowData, uploadedBy, stats);
                } catch (Exception e) {
                    stats.failedRecords++;
                    stats.addError(new UploadErrorDto(rowNumber, "N/A", "N/A", "Invalid row format: " + e.getMessage()));
                }
            }
        }

        if (stats.failedRecords > 0 && stats.successfulRecords > 0) {
            bulkUpload.setProcessingStatus(ProcessingStatus.PARTIAL_SUCCESS);
        } else if (stats.failedRecords > 0 && stats.successfulRecords == 0) {
            bulkUpload.setProcessingStatus(ProcessingStatus.FAILED);
        } else {
            bulkUpload.setProcessingStatus(ProcessingStatus.COMPLETED);
        }

        bulkUpload.setTotalRecords(stats.totalRecords);
        bulkUpload.setSuccessfulRecords(stats.successfulRecords);
        bulkUpload.setFailedRecords(stats.failedRecords);
        bulkUpload.setCompletedAt(Instant.now());

        Map<String, Object> errorLogData = new HashMap<>();
        errorLogData.put("updatedRecords", stats.updatedRecords);
        errorLogData.put("skippedRecords", stats.skippedRecords);
        errorLogData.put("duplicateRecords", stats.duplicateRecords);
        errorLogData.put("validationErrors", stats.errors);
        
        long processingTimeMs = Duration.between(startTime, bulkUpload.getCompletedAt()).toMillis();
        errorLogData.put("processingTimeMs", processingTimeMs);
        bulkUpload.setErrorLog(errorLogData);

        bulkUpload = bulkUploadRepository.save(bulkUpload);
        log.info("==========================================================================");
        log.info("--- [FACULTY BULK IMPORT SUMMARY LOGS] ---");
        log.info("Total rows received from request:    {}", records != null ? records.size() : 0);
        log.info("Total valid rows processed:          {}", stats.successfulRecords);
        log.info("Total invalid/failed rows:          {}", stats.failedRecords);
        log.info("Total inserted new rows:            {}", stats.successfulRecords - stats.updatedRecords);
        log.info("Total updated/duplicate rows:       {}", stats.updatedRecords);
        log.info("Total records committed to Postgres: {}", stats.successfulRecords);
        log.info("==========================================================================");

        return BulkUploadUtils.buildResponseDto(bulkUpload, stats, null, processingTimeMs);
    }

    private void executeRowInTransaction(int rowNumber, FacultyRowData data, User uploadedBy, UploadStats stats) {
        transactionTemplate.execute(status -> {
            try {
                processRow(rowNumber, data, uploadedBy, stats);
                return null;
            } catch (Exception e) {
                status.setRollbackOnly();
                stats.failedRecords++;
                log.error("[STEP 4 CONFIRM] Record {} Failed: {}", rowNumber, e.getMessage(), e);
                stats.addError(new UploadErrorDto(rowNumber, data.employeeId, data.collegeEmail, e.getMessage()));
                return null;
            }
        });
    }

    private void processRow(int rowNumber, FacultyRowData data, User uploadedBy, UploadStats stats) {
        if (data.employeeId.isEmpty() || data.collegeEmail.isEmpty()) {
            throw new IllegalArgumentException("Employee ID and College Email are strictly required.");
        }
        
        if (data.facultyName.isEmpty()) {
            throw new IllegalArgumentException("Faculty Name is strictly required.");
        }
        
        if (data.department.isEmpty()) {
            throw new IllegalArgumentException("Department is strictly required.");
        }
        
        if (data.role.isEmpty()) {
            throw new IllegalArgumentException("Role is strictly required.");
        }
        
        String[] nameParts = data.facultyName.trim().split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        Department department = resolveDepartment(data.department);

        UserRole userRole = UserRole.FACULTY; // default
        String inputRole = data.role.trim().toUpperCase();
        if (inputRole.contains("HOD") || inputRole.contains("HEAD")) {
            userRole = UserRole.HOD;
        } else if (inputRole.contains("COORDINATOR")) {
            userRole = UserRole.COORDINATOR;
        }
        
        // Use data.role as the designation string
        String designation = data.role.trim();

        boolean isUpdate = false;
        
        User user = userRepository.findByEmail(data.collegeEmail).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(data.collegeEmail);
            user.setPasswordHash(passwordEncoder.encode("AcroNexus@123")); // Default password
            user.setCreatedBy(uploadedBy.getId());
        } else {
            if (user.getRole() == UserRole.STUDENT) {
                throw new IllegalArgumentException("Email already in use by a STUDENT user.");
            }
            isUpdate = true;
        }

        user.setRole(userRole);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setDepartment(department);
        user.setUpdatedBy(uploadedBy.getId());
        
        if (data.mobileNumber != null && !data.mobileNumber.isEmpty()) {
            user.setPhone(data.mobileNumber);
        }
        
        if (data.gender != null && !data.gender.trim().isEmpty()) {
            try {
                user.setGender(Gender.valueOf(data.gender.trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setGender(Gender.MALE); // Safe fallback if unparseable
                log.warn("[ROW {}] Could not parse gender '{}', defaulting to MALE", rowNumber, data.gender);
            }
        }
        
        // Exact Status Mapping
        if (data.status != null && !data.status.trim().isEmpty()) {
            String s = data.status.trim().toUpperCase();
            if (s.equals("INACTIVE") || s.equals("FALSE") || s.equals("0") || s.equals("NO")) {
                user.setIsActive(false);
            } else {
                user.setIsActive(true);
            }
        } else if (!isUpdate) {
            user.setIsActive(true); // Default for new records if missing
        }

        log.info("[ROW {}] SAVING User: email={}, name='{} {}', dept={}, role={}, active={}", 
            rowNumber, user.getEmail(), firstName, lastName, department.getName(), userRole, user.getIsActive());
        user = userRepository.save(user);
        log.info("[ROW {}] User SAVED with ID: {}", rowNumber, user.getId());

        // Faculty Entity
        Faculty faculty = facultyRepository.findByEmployeeId(data.employeeId).orElse(null);
        if (faculty != null && !faculty.getId().equals(user.getId())) {
            throw new IllegalArgumentException("Employee ID is already associated with a different email/user.");
        }
        
        if (faculty == null) {
            faculty = facultyRepository.findById(user.getId()).orElse(null);
        }
        
        if (faculty == null) {
            faculty = new Faculty();
            faculty.setId(user.getId());
            faculty.setUser(user);
            faculty.setEmployeeId(data.employeeId);
            faculty.markAsNew();
        }
        faculty.setDesignation(designation);
        
        faculty.setEmployeeId(data.employeeId);
        
        if (data.qualification != null && !data.qualification.isEmpty()) {
            faculty.setQualification(data.qualification);
        }
        
        if (data.experience != null && !data.experience.trim().isEmpty()) {
            try {
                String cleanExp = data.experience.replaceAll("[^\\d.]", "");
                if (!cleanExp.isEmpty()) {
                    faculty.setExperienceYears((int) Math.round(Double.parseDouble(cleanExp)));
                } else {
                    faculty.setExperienceYears(0);
                }
            } catch (Exception e) {
                log.warn("Failed to parse experience: {}", data.experience);
                faculty.setExperienceYears(0);
            }
        }
        
        if (data.joiningDate != null && !data.joiningDate.trim().isEmpty()) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("[yyyy-MM-dd][dd-MM-yyyy][MM/dd/yyyy][dd/MM/yyyy]");
                faculty.setJoiningDate(LocalDate.parse(data.joiningDate.trim(), formatter));
            } catch (Exception e) {
                log.warn("[ROW {}] Could not parse joining date '{}', skipping field", rowNumber, data.joiningDate);
            }
        }

        log.info("[ROW {}] SAVING Faculty: empId={}, designation={}, qualification={}, isNew={}", 
            rowNumber, faculty.getEmployeeId(), faculty.getDesignation(), faculty.getQualification(), faculty.isNew());
        facultyRepository.save(faculty);
        log.info("[ROW {}] Faculty SAVED successfully for user ID: {}", rowNumber, user.getId());

        stats.successfulRecords++;
        if (isUpdate) {
            stats.updatedRecords++;
            stats.duplicateRecords++;
        }
    }
    
    private Department resolveDepartment(String deptName) {
        if (deptName != null && !deptName.trim().isEmpty()) {
            String cleanDept = deptName.trim();
            for (Department d : departmentRepository.findAll()) {
                if (d.getName().equalsIgnoreCase(cleanDept) || d.getCode().equalsIgnoreCase(cleanDept)) {
                    return d;
                }
            }
            Department newDept = new Department();
            newDept.setName(cleanDept);
            newDept.setCode(cleanDept.length() > 5 ? cleanDept.substring(0, 5).toUpperCase() : cleanDept.toUpperCase());
            newDept.setIsActive(true);
            return departmentRepository.save(newDept);
        }
        throw new IllegalArgumentException("Department is required.");
    }

    @Override
    public byte[] generateErrorReportCsv(UUID uploadId) {
        BulkUpload upload = bulkUploadRepository.findById(uploadId)
                .orElseThrow(() -> new IllegalArgumentException("Upload not found"));

        Object errorLog = upload.getErrorLog();
        if (errorLog == null) {
            return new byte[0];
        }

        ObjectMapper mapper = new ObjectMapper();
        try {
            Map<String, Object> logMap = mapper.convertValue(errorLog, new com.fasterxml.jackson.core.type.TypeReference<>() {});
            Object valErrorsObj = logMap.get("validationErrors");
            if (valErrorsObj == null) {
                return new byte[0];
            }
            
            List<Map<String, Object>> errors = mapper.convertValue(valErrorsObj, new com.fasterxml.jackson.core.type.TypeReference<>() {});

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                    .setHeader("Row Number", "Employee ID", "College Email", "Error Message")
                    .build();
            try (CSVPrinter printer = new CSVPrinter(new PrintWriter(out), csvFormat)) {
                for (Map<String, Object> err : errors) {
                    printer.printRecord(err.get("rowNumber"), err.get("enrollmentNo"), err.get("collegeEmail"), err.get("errorMessage"));
                }
            }
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate error report CSV for upload {}", uploadId, e);
            throw new RuntimeException("Failed to generate error report", e);
        }
    }

    @Override
    public AiFacultyValidationResultDto validateFacultyListWithAi(MultipartFile file, UUID uploadedByUserId) {
        List<Map<String, String>> rows = new ArrayList<>();

        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (filename.endsWith(".csv")) {
                CSVFormat csvFormat = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setTrim(true).build();
                try (Reader reader = new InputStreamReader(file.getInputStream());
                     CSVParser csvParser = new CSVParser(reader, csvFormat)) {
                    for (CSVRecord record : csvParser) {
                        Map<String, String> rowMap = new LinkedHashMap<>();
                        for (String header : csvParser.getHeaderNames()) {
                            rowMap.put(header, record.get(header));
                        }
                        rows.add(rowMap);
                    }
                }
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
                    Sheet sheet = workbook.getSheetAt(0);
                    Iterator<Row> rowIterator = sheet.iterator();
                    List<String> headers = new ArrayList<>();
                    if (rowIterator.hasNext()) {
                        Row headerRow = rowIterator.next();
                        for (Cell cell : headerRow) {
                            headers.add(BulkUploadUtils.getCellStringValue(cell));
                        }
                    }
                    while (rowIterator.hasNext()) {
                        Row row = rowIterator.next();
                        if (BulkUploadUtils.isRowEmpty(row)) continue;
                        Map<String, String> rowMap = new LinkedHashMap<>();
                        for (int i = 0; i < headers.size(); i++) {
                            Cell cell = row.getCell(i);
                            rowMap.put(headers.get(i), BulkUploadUtils.getCellStringValue(cell));
                        }
                        rows.add(rowMap);
                    }
                }
            } else {
                throw new IllegalArgumentException("Unsupported file format");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse file for AI validation: " + e.getMessage(), e);
        }

        if (rows.isEmpty()) {
            return AiFacultyValidationResultDto.builder().totalAnalyzed(0).issuesFound(0).aiSummary("No data found in file.").issues(new ArrayList<>()).rawRecords(new ArrayList<>()).build();
        }

        // Map raw headers to standard keys
        List<Map<String, String>> normalizedRows = new ArrayList<>();
        for (Map<String, String> rawRow : rows) {
            Map<String, String> normalizedRow = new LinkedHashMap<>();
            normalizedRow.put("facultyName", getFieldValue(rawRow, "facultyName", "name", "faculty", "fullName"));
            normalizedRow.put("employeeId", getFieldValue(rawRow, "employeeId", "empId", "employeeCode", "empCode"));
            normalizedRow.put("collegeEmail", getFieldValue(rawRow, "collegeEmail", "email", "emailId", "collegeEmailId", "emailAddress"));
            normalizedRow.put("gender", getFieldValue(rawRow, "gender", "sex"));
            normalizedRow.put("role", getFieldValue(rawRow, "role", "designation", "facultyRole"));
            normalizedRow.put("department", getFieldValue(rawRow, "department", "dept", "branch"));
            normalizedRow.put("mobileNumber", getFieldValue(rawRow, "mobileNumber", "phone", "mobile", "contact", "phoneNumber"));
            normalizedRow.put("joiningDate", getFieldValue(rawRow, "joiningDate", "doj", "dateOfJoining"));
            normalizedRow.put("qualification", getFieldValue(rawRow, "qualification", "degree"));
            normalizedRow.put("experience", getFieldValue(rawRow, "experience", "experienceYears", "exp"));
            normalizedRow.put("status", getFieldValue(rawRow, "status", "isActive", "active"));
            normalizedRows.add(normalizedRow);
        }

        // Cap the number of rows to avoid token limits for validation
        List<Map<String, String>> sampleRows = normalizedRows.size() > 50 ? normalizedRows.subList(0, 50) : normalizedRows;

        List<String> validDepartments = departmentRepository.findAll().stream().map(Department::getName).toList();
        List<String> validSubjects = subjectRepository.findAll().stream().map(s -> s.getName() + " (" + s.getCode() + ")").toList();
        List<String> validSemesters = semesterRepository.findAll().stream().map(s -> String.valueOf(s.getSemesterNumber())).toList();
        List<String> validAcademicYears = academicYearRepository.findAll().stream().map(AcademicYear::getYear).toList();
        List<String> validClasses = acroClassRepository.findAll().stream().map(c -> c.getName() + " " + c.getSection()).toList();

        Map<String, Object> aiRequestData = new HashMap<>();
        aiRequestData.put("rows", sampleRows);
        aiRequestData.put("validDepartments", validDepartments);
        aiRequestData.put("validSubjects", validSubjects);
        aiRequestData.put("validSemesters", validSemesters);
        aiRequestData.put("validAcademicYears", validAcademicYears);
        aiRequestData.put("validClasses", validClasses);

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("validationType", "FACULTY");
        aiRequest.put("data", aiRequestData);

        try {
            ObjectMapper mapper = new ObjectMapper();
            log.info("[STEP 6] Data sent to AI service: {}", mapper.writeValueAsString(aiRequest));

            AiFacultyValidationResultDto result = aiService.validateData(aiRequest, AiFacultyValidationResultDto.class);
            result.setTotalAnalyzed(normalizedRows.size());
            result.setRawRecords(new ArrayList<>(rows)); // Save all original raw records
            log.info("[STEP 6] AI validation successful. Issues found: {}", result.getIssuesFound());
            return result;
        } catch (Exception e) {
            log.error("[STEP 6] Failed to parse AI response.", e);
            throw new RuntimeException("Failed to parse AI validation response.", e);
        }
    }

    private String getFieldValue(Map<String, String> map, String... keys) {
        if (map == null) return "";
        for (String key : keys) {
            if (map.containsKey(key) && map.get(key) != null && !map.get(key).trim().isEmpty()) {
                return map.get(key).trim();
            }
            // Case-insensitive key check
            String normKey = normalizeHeader(key);
            for (Map.Entry<String, String> entry : map.entrySet()) {
                if (entry.getKey() != null && normalizeHeader(entry.getKey()).equals(normKey)) {
                    if (entry.getValue() != null && !entry.getValue().trim().isEmpty()) {
                        return entry.getValue().trim();
                    }
                }
            }
        }
        return "";
    }

    private String normalizeHeader(String header) {
        if (header == null) return "";
        return header.trim().toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private static class FacultyRowData {
        String facultyName;
        String employeeId;
        String collegeEmail;
        String gender;
        String role;
        String department;
        String mobileNumber;
        String joiningDate;
        String qualification;
        String experience;
        String status;

        public FacultyRowData(String facultyName, String employeeId, String collegeEmail, String gender, String role, 
                              String department, String mobileNumber, String joiningDate, String qualification, String experience, String status) {
            this.facultyName = facultyName != null ? facultyName.trim() : "";
            this.employeeId = employeeId != null ? employeeId.trim() : "";
            this.collegeEmail = collegeEmail != null ? collegeEmail.trim() : "";
            this.gender = gender != null ? gender.trim() : "";
            this.role = role != null ? role.trim() : "";
            this.department = department != null ? department.trim() : "";
            this.mobileNumber = mobileNumber != null ? mobileNumber.trim() : "";
            this.joiningDate = joiningDate != null ? joiningDate.trim() : "";
            this.qualification = qualification != null ? qualification.trim() : "";
            this.experience = experience != null ? experience.trim() : "";
            this.status = status != null ? status.trim() : "";
        }

        @Override
        public String toString() {
            return "FacultyRowData{" +
                    "facultyName='" + facultyName + '\'' +
                    ", employeeId='" + employeeId + '\'' +
                    ", collegeEmail='" + collegeEmail + '\'' +
                    ", gender='" + gender + '\'' +
                    ", role='" + role + '\'' +
                    ", department='" + department + '\'' +
                    ", status='" + status + '\'' +
                    '}';
        }
    }
}
