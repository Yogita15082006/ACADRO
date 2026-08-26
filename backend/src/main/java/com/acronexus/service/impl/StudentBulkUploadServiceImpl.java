package com.acronexus.service.impl;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.dto.UploadErrorDto;
import com.acronexus.dto.AiStudentValidationResultDto;
import com.acronexus.service.AiService;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.StudentBulkUploadService;
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
import java.time.ZonedDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentBulkUploadServiceImpl implements StudentBulkUploadService {

    private final BulkUploadRepository bulkUploadRepository;
    private final FileStorageRepository fileStorageRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final StudentEnrollmentRepository studentEnrollmentRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final AcroClassRepository acroClassRepository;
    private final DepartmentRepository departmentRepository;
    private final DegreeProgramRepository degreeProgramRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;
    private final AiService aiService;

    @Override
    public BulkUploadResponseDto uploadStudentList(MultipartFile file, UUID uploadedByUserId) {
        Instant startTime = Instant.now();
        User uploadedBy = userRepository.findById(uploadedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("Uploader not found"));

        // Create FileStorage entry
        FileStorage fileStorage = new FileStorage();
        fileStorage.setFileName(file.getOriginalFilename());
        fileStorage.setFileType(file.getContentType());
        fileStorage.setDocumentUrl("local-storage://" + UUID.randomUUID() + "-" + file.getOriginalFilename());
        fileStorage.setUploadedBy(uploadedBy);
        fileStorage.setUploadedAt(ZonedDateTime.now());
        fileStorage = fileStorageRepository.save(fileStorage);

        // Create BulkUpload entry
        BulkUpload bulkUpload = new BulkUpload();
        bulkUpload.setUploadType(UploadType.STUDENT_LIST);
        bulkUpload.setFile(fileStorage);
        bulkUpload.setProcessingStatus(ProcessingStatus.PROCESSING);
        bulkUpload.setUploadedBy(uploadedBy);
        bulkUpload = bulkUploadRepository.save(bulkUpload);

        UploadStats stats = new UploadStats();

        // Process file
        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (filename.endsWith(".csv")) {
                processCsv(file, uploadedBy, stats);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                processExcel(file, uploadedBy, stats);
            } else {
                throw new IllegalArgumentException("Unsupported file format. Please upload .csv or .xlsx files.");
            }

            if (stats.failedRecords > 0 && stats.successfulRecords > 0) {
                bulkUpload.setProcessingStatus(ProcessingStatus.PARTIAL_SUCCESS);
            } else if (stats.failedRecords > 0 && stats.successfulRecords == 0) {
                bulkUpload.setProcessingStatus(ProcessingStatus.FAILED);
            } else {
                bulkUpload.setProcessingStatus(ProcessingStatus.COMPLETED);
            }
        } catch (Exception e) {
            log.error("Bulk upload processing failed completely", e);
            bulkUpload.setProcessingStatus(ProcessingStatus.FAILED);
            stats.addError(new UploadErrorDto(0, "N/A", "N/A", "Fatal error processing file: " + e.getMessage()));
        }

        bulkUpload.setTotalRecords(stats.totalRecords);
        bulkUpload.setSuccessfulRecords(stats.successfulRecords);
        bulkUpload.setFailedRecords(stats.failedRecords);
        bulkUpload.setCompletedAt(Instant.now());

        // Map advanced logs into errorLog jsonb
        Map<String, Object> errorLogData = new HashMap<>();
        errorLogData.put("updatedRecords", stats.updatedRecords);
        errorLogData.put("skippedRecords", stats.skippedRecords);
        errorLogData.put("duplicateRecords", stats.duplicateRecords);
        errorLogData.put("validationErrors", stats.errors);
        
        long processingTimeMs = Duration.between(startTime, bulkUpload.getCompletedAt()).toMillis();
        errorLogData.put("processingTimeMs", processingTimeMs);
        errorLogData.put("fileSize", file.getSize());
        
        bulkUpload.setErrorLog(errorLogData);

        bulkUpload = bulkUploadRepository.save(bulkUpload);

        return buildResponseDto(bulkUpload, stats, fileStorage, processingTimeMs);
    }

    private void processCsv(MultipartFile file, User uploadedBy, UploadStats stats) throws Exception {
        CSVFormat csvFormat = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVParser csvParser = new CSVParser(reader, csvFormat)) {
            
            int rowNumber = 1;
            for (CSVRecord record : csvParser) {
                rowNumber++;
                stats.totalRecords++;
                try {
                    if (record.getParser() != null && record.getParser().getHeaderMap() != null) {
                        log.info("[STEP 3] Parsed CSV Record (Row {}): {}", rowNumber, record.toMap());
                    } else {
                        log.info("[STEP 3] Parsed CSV Record (Row {}) (No Header Map): {}", rowNumber, record.toList());
                    }
                    StudentRowData rowData = new StudentRowData(
                            getSafeCsv(record, "Student Name", "Name", "Student", "Full Name", "StudentName"),
                            getSafeCsv(record, "Enrollment No", "Enrollment Number", "Enrollment", "EnrollmentNo"),
                            getSafeCsv(record, "College Email", "Email", "Email ID", "College Email ID", "Email Address", "EmailId", "CollegeEmail"),
                            getSafeCsv(record, "Gender", "Sex"),
                            getSafeCsv(record, "Batch", "Batch Year", "BatchYear"),
                            getSafeCsv(record, "Academic Year", "Year", "AcademicYear"),
                            getSafeCsv(record, "Semester", "Sem", "Current Semester"),
                            getSafeCsv(record, "Class", "Course", "AcroClass", "Program"),
                            getSafeCsv(record, "Section", "Sec", "Batch Section"),
                            getSafeCsv(record, "Mobile Number", "Phone", "Mobile", "Contact", "Phone Number", "MobileNumber", "Contact Number"),
                            getSafeCsv(record, "Status", "IsActive", "Active"),
                            getSafeCsv(record, "Department", "Dept", "Branch", "Stream", "Discipline"),
                            getSafeCsv(record, "Degree", "Degree Program", "DegreeProgram"),
                            getSafeCsv(record, "Roll Number", "Roll No", "Roll", "RollNo", "Class Roll No"),
                            getSafeCsv(record, "Admission Year", "Year of Admission", "AdmissionYear", "Institute Enrollment", "Institute Enrollment No"),
                            getSafeCsv(record, "Personal Email", "Alternate Email", "PersonalEmail"),
                            getSafeCsv(record, "Whatsapp Number", "Whatsapp", "WhatsappNo"),
                            getSafeCsv(record, "Date of Birth", "DOB", "Birth Date", "DateOfBirth"),
                            getSafeCsv(record, "Category", "Caste Category", "Caste"),
                            getSafeCsv(record, "Religion", "Community"),
                            getSafeCsv(record, "Nationality", "Country"),
                            getSafeCsv(record, "Residence Type", "Residence", "Hosteller", "Day Scholar", "Stay Type"),
                            getSafeCsv(record, "Blood Group", "BloodGroup", "Blood"),
                            getSafeCsv(record, "Hobbies", "Interests"),
                            getSafeCsv(record, "Clubs", "Communities")
                    );
                    log.info("[STEP 4] Mapped CSV Row {}: {}", rowNumber, rowData);
                    executeRowInTransaction(rowNumber, rowData, uploadedBy, stats);
                } catch (Exception e) {
                    stats.failedRecords++;
                    stats.addError(new UploadErrorDto(rowNumber, "N/A", "N/A", "Invalid row data: " + e.getMessage()));
                }
            }
        }
    }

    private String normalizeHeader(String header) {
        if (header == null) return "";
        return header.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
    }

    private String getSafeCsv(CSVRecord record, String... headers) {
        if (record.getParser() != null && record.getParser().getHeaderMap() != null) {
            Map<String, Integer> headerMap = record.getParser().getHeaderMap();
            for (String header : headers) {
                String normExpected = normalizeHeader(header);
                for (String actualHeader : headerMap.keySet()) {
                    String cleanActual = normalizeHeader(actualHeader.replace("\uFEFF", ""));
                    if (cleanActual.equals(normExpected)) {
                        String value = record.get(actualHeader);
                        log.debug("Found mapped header '{}' for expected '{}'. Value: '{}'", actualHeader, normExpected, value);
                        return value.trim();
                    }
                }
            }
        } else {
            // Fallback for when parser header map isn't easily accessible
            for (String header : headers) {
                try {
                    if (record.isMapped(header)) return record.get(header).trim();
                } catch (IllegalArgumentException e) {
                    // Ignore
                }
            }
        }
        return "";
    }

    private void processExcel(MultipartFile file, User uploadedBy, UploadStats stats) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            
            Map<String, Integer> headerMap = new HashMap<>();
            if (rows.hasNext()) {
                Row headerRow = rows.next();
                for (Cell cell : headerRow) {
                    headerMap.put(normalizeHeader(getCellStringValue(cell).replace("\uFEFF", "")), cell.getColumnIndex());
                }
            }

            int rowNumber = 1;
            while (rows.hasNext()) {
                Row row = rows.next();
                rowNumber++;
                if (isRowEmpty(row)) continue;
                
                stats.totalRecords++;
                try {
                    Map<String, String> rawExcelData = new HashMap<>();
                    for (Map.Entry<String, Integer> entry : headerMap.entrySet()) {
                        rawExcelData.put(entry.getKey(), getCellStringValue(row.getCell(entry.getValue())));
                    }
                    log.info("[STEP 3] Parsed Excel Record (Row {}): {}", rowNumber, rawExcelData);

                    StudentRowData rowData = new StudentRowData(
                            getSafeExcel(row, headerMap, "Student Name", "Name", "Student", "Full Name", "StudentName"),
                            getSafeExcel(row, headerMap, "Enrollment No", "Enrollment Number", "Enrollment", "EnrollmentNo"),
                            getSafeExcel(row, headerMap, "College Email", "Email", "Email ID", "College Email ID", "Email Address", "EmailId", "CollegeEmail"),
                            getSafeExcel(row, headerMap, "Gender", "Sex"),
                            getSafeExcel(row, headerMap, "Batch", "Batch Year", "BatchYear"),
                            getSafeExcel(row, headerMap, "Academic Year", "Year", "AcademicYear"),
                            getSafeExcel(row, headerMap, "Semester", "Sem", "Current Semester"),
                            getSafeExcel(row, headerMap, "Class", "Course", "AcroClass", "Program"),
                            getSafeExcel(row, headerMap, "Section", "Sec", "Batch Section"),
                            getSafeExcel(row, headerMap, "Mobile Number", "Phone", "Mobile", "Contact", "Phone Number", "MobileNumber", "Contact Number"),
                            getSafeExcel(row, headerMap, "Status", "IsActive", "Active"),
                            getSafeExcel(row, headerMap, "Department", "Dept", "Branch", "Stream", "Discipline"),
                            getSafeExcel(row, headerMap, "Degree", "Degree Program", "DegreeProgram"),
                            getSafeExcel(row, headerMap, "Roll Number", "Roll No", "Roll", "RollNo", "Class Roll No"),
                            getSafeExcel(row, headerMap, "Admission Year", "Year of Admission", "AdmissionYear", "Institute Enrollment", "Institute Enrollment No"),
                            getSafeExcel(row, headerMap, "Personal Email", "Alternate Email", "PersonalEmail"),
                            getSafeExcel(row, headerMap, "Whatsapp Number", "Whatsapp", "WhatsappNo"),
                            getSafeExcel(row, headerMap, "Date of Birth", "DOB", "Birth Date", "DateOfBirth"),
                            getSafeExcel(row, headerMap, "Category", "Caste Category", "Caste"),
                            getSafeExcel(row, headerMap, "Religion", "Community"),
                            getSafeExcel(row, headerMap, "Nationality", "Country"),
                            getSafeExcel(row, headerMap, "Residence Type", "Residence", "Hosteller", "Day Scholar", "Stay Type"),
                            getSafeExcel(row, headerMap, "Blood Group", "BloodGroup", "Blood"),
                            getSafeExcel(row, headerMap, "Hobbies", "Interests"),
                            getSafeExcel(row, headerMap, "Clubs", "Communities")
                    );
                    log.info("[STEP 4] Mapped Excel Row {}: {}", rowNumber, rowData);
                    executeRowInTransaction(rowNumber, rowData, uploadedBy, stats);
                } catch (Exception e) {
                    stats.failedRecords++;
                    stats.addError(new UploadErrorDto(rowNumber, "N/A", "N/A", "Invalid row data: " + e.getMessage()));
                }
            }
        }
    }
    
    private String getSafeExcel(Row row, Map<String, Integer> headerMap, String... headers) {
        for (String header : headers) {
            Integer idx = headerMap.get(normalizeHeader(header));
            if (idx != null) {
                return getCellStringValue(row.getCell(idx));
            }
        }
        return "";
    }

    private void executeRowInTransaction(int rowNumber, StudentRowData data, User uploadedBy, UploadStats stats) {
        transactionTemplate.execute(status -> {
            try {
                processRow(rowNumber, data, uploadedBy, stats);
                return null;
            } catch (Exception e) {
                status.setRollbackOnly(); // Rollback this row only
                stats.failedRecords++;
                stats.addError(new UploadErrorDto(rowNumber, data.enrollmentNo, data.collegeEmail, e.getMessage()));
                return null;
            }
        });
    }

    @Override
    public BulkUploadResponseDto importValidatedStudents(List<Map<String, String>> records, UUID uploadedByUserId) {
        Instant startTime = Instant.now();
        User uploadedBy = userRepository.findById(uploadedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("Uploader not found"));

        log.info("==========================================================================");
        log.info("--- [CONFIRM & IMPORT START] Processing {} AI-validated student records ---", records != null ? records.size() : 0);
        log.info("==========================================================================");

        // Create FileStorage placeholder for validated JSON import
        FileStorage fileStorage = new FileStorage();
        fileStorage.setFileName("ai-validated-import.json");
        fileStorage.setFileType("application/json");
        fileStorage.setDocumentUrl("json-import://" + UUID.randomUUID());
        fileStorage.setUploadedBy(uploadedBy);
        fileStorage.setUploadedAt(ZonedDateTime.now());
        fileStorage = fileStorageRepository.save(fileStorage);

        // Create BulkUpload record
        BulkUpload bulkUpload = new BulkUpload();
        bulkUpload.setUploadType(UploadType.STUDENT_LIST);
        bulkUpload.setFile(fileStorage);
        bulkUpload.setProcessingStatus(ProcessingStatus.PROCESSING);
        bulkUpload.setUploadedBy(uploadedBy);
        bulkUpload = bulkUploadRepository.save(bulkUpload);

        UploadStats stats = new UploadStats();

        if (records != null && !records.isEmpty()) {
            int rowNumber = 1;
            for (Map<String, String> recordMap : records) {
                rowNumber++;
                stats.totalRecords++;
                
                String rawName = getFieldValue(recordMap, "studentName", "name", "student", "fullName");
                String rawEnrollment = getFieldValue(recordMap, "enrollmentNumber", "enrollmentNo", "enrollment");
                String rawEmail = getFieldValue(recordMap, "collegeEmail", "email", "emailId", "collegeEmailId", "emailAddress");
                String rawGender = getFieldValue(recordMap, "gender", "sex");
                String rawBatch = getFieldValue(recordMap, "batchYear", "batch");
                String rawAcademicYear = getFieldValue(recordMap, "academicYear", "year");
                String rawSemester = getFieldValue(recordMap, "semester", "sem", "currentSemester");
                String rawAcroClass = getFieldValue(recordMap, "acroClass", "class", "className", "course", "program");
                String rawSection = getFieldValue(recordMap, "section", "sec", "batchSection");
                String rawMobile = getFieldValue(recordMap, "mobileNumber", "phone", "mobile", "contact", "phoneNumber");
                String rawStatus = getFieldValue(recordMap, "status", "isActive", "active");
                String rawDepartment = getFieldValue(recordMap, "department", "dept", "branch", "stream", "discipline");
                String rawDegree = getFieldValue(recordMap, "degree", "degreeProgram");
                String rawRollNo = getFieldValue(recordMap, "rollNumber", "rollNo", "roll", "classRollNo");
                String rawAdmissionYear = getFieldValue(recordMap, "admissionYear", "yearOfAdmission", "instituteEnrollment", "instituteEnrollmentNo");
                String rawPersonalEmail = getFieldValue(recordMap, "personalEmail", "alternateEmail");
                String rawWhatsapp = getFieldValue(recordMap, "whatsappNumber", "whatsapp", "whatsappNo");
                String rawDob = getFieldValue(recordMap, "dob", "dateOfBirth", "birthDate");
                String rawCategory = getFieldValue(recordMap, "category", "casteCategory", "caste");
                String rawReligion = getFieldValue(recordMap, "religion", "community");
                String rawNationality = getFieldValue(recordMap, "nationality", "country");
                String rawResidenceType = getFieldValue(recordMap, "residenceType", "residence", "stayType", "hosteller", "dayScholar");
                String rawBloodGroup = getFieldValue(recordMap, "bloodGroup", "blood");
                String rawHobbies = getFieldValue(recordMap, "hobbies", "interests");
                String rawClubs = getFieldValue(recordMap, "clubs", "communities", "groups");

                StudentRowData rowData = new StudentRowData(
                        rawName, rawEnrollment, rawEmail, rawGender, rawBatch,
                        rawAcademicYear, rawSemester, rawAcroClass, rawSection, rawMobile, rawStatus, rawDepartment, rawDegree,
                        rawRollNo, rawAdmissionYear, rawPersonalEmail, rawWhatsapp, rawDob, rawCategory, rawReligion, rawNationality, rawResidenceType, rawBloodGroup, rawHobbies, rawClubs
                );

                log.info("[STEP 4 CONFIRM] Record {}: {}", rowNumber, rowData);
                executeRowInTransaction(rowNumber, rowData, uploadedBy, stats);
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
        log.info("--- [BULK IMPORT SUMMARY LOGS] ---");
        log.info("Total rows received from request:    {}", records != null ? records.size() : 0);
        log.info("Total valid rows processed:          {}", stats.successfulRecords);
        log.info("Total invalid/failed rows:          {}", stats.failedRecords);
        log.info("Total inserted new rows:            {}", stats.successfulRecords - stats.updatedRecords);
        log.info("Total updated/duplicate rows:       {}", stats.updatedRecords);
        log.info("Total records committed to Postgres: {}", stats.successfulRecords);
        log.info("==========================================================================");

        return buildResponseDto(bulkUpload, stats, fileStorage, processingTimeMs);
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
        // Flexible substring matching for headers with description descriptions (e.g., "Batch (e.g. 2024-2028)")
        for (String key : keys) {
            String normKey = normalizeHeader(key);
            for (Map.Entry<String, String> entry : map.entrySet()) {
                if (entry.getKey() != null) {
                    String normEntry = normalizeHeader(entry.getKey());
                    // Only apply flexible matching if the normEntry strictly contains normKey
                    // and we avoid known collisions (e.g. "batch" vs "batchsection")
                    if (normEntry.contains(normKey) && !isKnownCollision(normKey, normEntry)) {
                        if (entry.getValue() != null && !entry.getValue().trim().isEmpty()) {
                            return entry.getValue().trim();
                        }
                    }
                }
            }
        }
        return "";
    }

    private boolean isKnownCollision(String searchKey, String targetHeader) {
        if (searchKey.equals("batch") && targetHeader.contains("section")) return true;
        if (searchKey.equals("year") && (targetHeader.contains("batch") || targetHeader.contains("admission"))) return true;
        return false;
    }

    private AcroClass resolveAcroClass(String className, String sectionName, String deptName, String degreeName) {
        String cleanClass = className != null ? className.trim() : "";
        String cleanSec = sectionName != null ? sectionName.trim() : "";

        if (cleanClass.isEmpty() && cleanSec.isEmpty()) {
            cleanClass = "General";
            cleanSec = "";
        } else if (cleanClass.isEmpty() && !cleanSec.isEmpty()) {
            cleanClass = cleanSec;
            cleanSec = "";
        }

        // 1. Exact search by name and section
        Optional<AcroClass> opt = acroClassRepository.findByNameIgnoreCaseAndSectionIgnoreCase(cleanClass, cleanSec);
        if (opt.isPresent()) return opt.get();

        // 2. Search by combination if someone uploaded "DS" and "1" but it exists as "DS-1"
        List<AcroClass> all = acroClassRepository.findAll();
        for (AcroClass c : all) {
            String combinedHyphen = (c.getName() + (c.getSection() != null && !c.getSection().isEmpty() ? "-" + c.getSection() : "")).toLowerCase();
            String targetCombined = (cleanClass + (!cleanSec.isEmpty() ? "-" + cleanSec : "")).toLowerCase();
            if (combinedHyphen.equalsIgnoreCase(targetCombined)) {
                return c;
            }
        }

        // 3. Create dynamically with exactly the requested name
        log.info("AcroClass not found. Creating dynamically: Name={}, Sec={}", cleanClass, cleanSec);
        Department dept = resolveDepartment(null, deptName);
        DegreeProgram degree = resolveDegreeProgram(null, degreeName, dept);

        AcroClass newClass = new AcroClass();
        newClass.setName(cleanClass);
        newClass.setSection(cleanSec);
        newClass.setDepartment(dept);
        newClass.setDegreeProgram(degree);
        newClass.setIsActive(true);
        return acroClassRepository.save(newClass);
    }

    private Department resolveDepartment(AcroClass acroClass, String deptName) {
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
        if (acroClass != null && acroClass.getDepartment() != null) {
            return acroClass.getDepartment();
        }
        throw new IllegalArgumentException("Department is required and cannot be inferred. Please provide a valid Department in the upload.");
    }

    private DegreeProgram resolveDegreeProgram(AcroClass acroClass, String degreeName, Department dept) {
        if (degreeName != null && !degreeName.trim().isEmpty()) {
            String cleanDegree = degreeName.trim();
            for (DegreeProgram dp : degreeProgramRepository.findAll()) {
                if (dp.getName().equalsIgnoreCase(cleanDegree)) {
                    return dp;
                }
            }
            DegreeProgram newDegree = new DegreeProgram();
            newDegree.setName(cleanDegree);
            newDegree.setIsActive(true);
            return degreeProgramRepository.save(newDegree);
        }
        if (acroClass != null && acroClass.getDegreeProgram() != null) {
            return acroClass.getDegreeProgram();
        }
        return null;
    }

    private AcademicYear resolveAcademicYear(String yearStr) {
        String cleanYear = yearStr != null ? yearStr.trim() : "";
        if ("1".equals(cleanYear) || "1st".equalsIgnoreCase(cleanYear)) cleanYear = "1st Year";
        else if ("2".equals(cleanYear) || "2nd".equalsIgnoreCase(cleanYear)) cleanYear = "2nd Year";
        else if ("3".equals(cleanYear) || "3rd".equalsIgnoreCase(cleanYear)) cleanYear = "3rd Year";
        else if ("4".equals(cleanYear) || "4th".equalsIgnoreCase(cleanYear)) cleanYear = "4th Year";

        if (!cleanYear.isEmpty()) {
            Optional<AcademicYear> opt = academicYearRepository.findByYear(cleanYear);
            if (opt.isPresent()) return opt.get();
        }

        List<AcademicYear> all = academicYearRepository.findAll();
        if (!cleanYear.isEmpty()) {
            for (AcademicYear ay : all) {
                if (ay.getYear().equalsIgnoreCase(cleanYear)) {
                    return ay;
                }
            }
        }

        java.time.LocalDate now = java.time.LocalDate.now();
        int startYear = now.getMonthValue() >= 7 ? now.getYear() : (now.getYear() - 1);
        int endYear = startYear + 1;
        if (!cleanYear.isEmpty()) {
            String[] parts = cleanYear.split("[-/ ]");
            try {
                if (parts.length > 0 && parts[0].matches("\\d{4}")) startYear = Integer.parseInt(parts[0]);
                if (parts.length > 1 && parts[1].matches("\\d{4}")) endYear = Integer.parseInt(parts[1]);
                else endYear = startYear + 1;
            } catch (Exception e) {
                log.warn("Failed to parse start/end years from '{}'", cleanYear);
            }
        }

        String finalYearStr = !cleanYear.isEmpty() ? cleanYear : (startYear + "-" + endYear);
        
        // Check again with finalYearStr just in case
        Optional<AcademicYear> finalOpt = academicYearRepository.findByYear(finalYearStr);
        if (finalOpt.isPresent()) return finalOpt.get();
        
        for (AcademicYear ay : all) {
            if (ay.getYear().equalsIgnoreCase(finalYearStr)) {
                return ay;
            }
        }

        AcademicYear ay = new AcademicYear();
        ay.setYear(finalYearStr);
        ay.setStartDate(java.time.LocalDate.of(startYear, 7, 1));
        ay.setEndDate(java.time.LocalDate.of(endYear, 6, 30));
        ay.setIsActive(true);
        ay = academicYearRepository.save(ay);
        log.info("Dynamically created AcademicYear in PostgreSQL: year='{}', startDate={}, endDate={}", finalYearStr, ay.getStartDate(), ay.getEndDate());
        return ay;
    }

    private Semester resolveSemester(String semStr, UUID academicYearId) {
        int semNum = 1;
        if (semStr != null && !semStr.trim().isEmpty()) {
            try {
                String digits = semStr.replaceAll("[^0-9.]", "");
                if (!digits.isEmpty()) {
                    semNum = (int) Double.parseDouble(digits);
                }
            } catch (Exception e) {
                log.warn("Failed to parse semester number '{}'", semStr);
            }
        }

        Optional<Semester> opt = semesterRepository.findBySemesterNumberAndAcademicYearId(semNum, academicYearId);
        if (opt.isPresent()) return opt.get();

        List<Semester> all = semesterRepository.findAll();
        for (Semester s : all) {
            if (s.getSemesterNumber() == semNum && (s.getAcademicYear() != null && s.getAcademicYear().getId().equals(academicYearId))) {
                return s;
            }
        }

        // Dynamically create Semester for this academic year in PostgreSQL
        AcademicYear ay = academicYearRepository.findById(academicYearId).orElse(null);
        Semester s = new Semester();
        s.setSemesterNumber(semNum);
        s.setAcademicYear(ay);
        s.setStartDate(ay != null && ay.getStartDate() != null ? ay.getStartDate() : java.time.LocalDate.now());
        s.setEndDate(ay != null && ay.getEndDate() != null ? ay.getEndDate() : java.time.LocalDate.now().plusYears(1));
        s.setIsActive(true);
        s = semesterRepository.save(s);
        log.info("Dynamically created Semester {} in PostgreSQL for AcademicYear ID {}", semNum, academicYearId);
        return s;
    }

    private String[] calculateYearAndSemFromBatch(String batch) {
        String academicYearStr = "";
        int semNum = 1;
        if (batch != null && !batch.trim().isEmpty()) {
            String cleanBatch = batch.trim();
            int startYear = 0;
            String[] parts = cleanBatch.split("[-/ ]");
            if (parts.length > 0) {
                try {
                    String digits = parts[0].replaceAll("[^0-9]", "");
                    if (digits.length() >= 4) {
                        startYear = Integer.parseInt(digits.substring(0, 4));
                    }
                } catch (Exception e) {
                    // ignore
                }
            }
            if (startYear > 0) {
                java.time.LocalDate now = java.time.LocalDate.now();
                int currentYear = now.getYear();
                int currentMonth = now.getMonthValue();
                int yearsElapsed = currentYear - startYear;
                int academicYearNum = currentMonth >= 7 ? yearsElapsed + 1 : yearsElapsed;
                int sem = currentMonth >= 7 ? (academicYearNum - 1) * 2 + 1 : (academicYearNum - 1) * 2;
                sem = Math.max(1, Math.min(8, sem));
                semNum = sem;
                int ayStart = currentMonth >= 7 ? currentYear : (currentYear - 1);
                academicYearStr = ayStart + "-" + (ayStart + 1);
            }
        }
        if (academicYearStr.isEmpty()) {
            java.time.LocalDate now = java.time.LocalDate.now();
            int ayStart = now.getMonthValue() >= 7 ? now.getYear() : (now.getYear() - 1);
            academicYearStr = ayStart + "-" + (ayStart + 1);
        }
        return new String[]{academicYearStr, String.valueOf(semNum)};
    }

    private void processRow(int rowNumber, StudentRowData data, User uploadedBy, UploadStats stats) {
        log.info("--------------------------------------------------------------------------");
        log.info("--- [DATA TRACE ROW {}] START PROCESSING ---", rowNumber);
        if (data.enrollmentNo == null || data.enrollmentNo.trim().isEmpty()) {
            throw new IllegalArgumentException("Enrollment Number is strictly required.");
        }
        
        if (data.studentName == null || data.studentName.trim().isEmpty()) {
            throw new IllegalArgumentException("Student Name is strictly required.");
        }
        
        // Safely determine email first to check for existing records
        String email = data.collegeEmail != null ? data.collegeEmail.trim() : "";
        if (email.isEmpty()) {
            email = data.enrollmentNo.trim().toLowerCase() + "@acropolis.in";
        }

        // PREVENT DESTRUCTIVE DEFAULTS: Fetch existing student early
        Student existingStudent = studentRepository.findByEnrollmentNo(data.enrollmentNo).orElse(null);
        if (existingStudent == null) {
            User existingUser = userRepository.findByEmail(email).orElse(null);
            if (existingUser != null) {
                existingStudent = studentRepository.findById(existingUser.getId()).orElse(null);
            }
        }

        String[] nameParts = data.studentName.trim().split(" ", 2);
        String firstName = nameParts[0];
        String lastName = nameParts.length > 1 ? nameParts[1] : "";

        // Resolve existing academic fields if omitted in upload
        String classInput = data.acroClass != null && !data.acroClass.trim().isEmpty() ? data.acroClass.trim() : (existingStudent != null ? existingStudent.getCourse() : "");
        String sectionInput = data.section != null && !data.section.trim().isEmpty() ? data.section.trim() : (existingStudent != null ? existingStudent.getSection() : "");
        String batchYearInput = data.batchYear != null && !data.batchYear.trim().isEmpty() ? data.batchYear.trim() : (existingStudent != null ? existingStudent.getBatchYear() : "");
        String academicYearInput = data.academicYear != null && !data.academicYear.trim().isEmpty() ? data.academicYear.trim() : "";
        String semesterInput = data.semester != null && !data.semester.trim().isEmpty() ? data.semester.trim() : (existingStudent != null ? existingStudent.getCurrentSemester() : "");

        AcroClass acroClass = resolveAcroClass(classInput, sectionInput, data.department, data.degree);
        Department department = resolveDepartment(acroClass, data.department);
        DegreeProgram degreeProgram = resolveDegreeProgram(acroClass, data.degree, department);
        
        if (academicYearInput.isEmpty() || semesterInput.isEmpty()) {
            String[] calc = calculateYearAndSemFromBatch(batchYearInput);
            if (academicYearInput.isEmpty()) academicYearInput = calc[0];
            if (semesterInput.isEmpty()) semesterInput = calc[1];
        }

        AcademicYear academicYear = resolveAcademicYear(academicYearInput);
        Semester semester = resolveSemester(semesterInput, academicYear.getId());

        // TRACE LOG FOR ALL 13 FIELDS BEFORE AND AFTER MAPPING
        log.info("=== [MAPPING TRACE ROW {}] ===", rowNumber);
        log.info("1. Enrollment Number: raw='{}' -> mapped='{}'", data.enrollmentNo, data.enrollmentNo);
        log.info("2. College Email:    raw='{}' -> mapped='{}'", data.collegeEmail, email);
        log.info("3. First Name:       rawName='{}' -> mapped='{}'", data.studentName, firstName);
        log.info("4. Last Name:        rawName='{}' -> mapped='{}'", data.studentName, lastName);
        log.info("5. Department:       rawClass='{}' -> resolved='{}'", data.acroClass, department.getName());
        log.info("6. Degree:           rawClass='{}' -> resolved='{}'", data.acroClass, degreeProgram != null ? degreeProgram.getName() : "null");
        log.info("7. Class:            rawClass='{}' -> resolved='{}'", data.acroClass, acroClass.getName());
        log.info("8. Section:          rawSection='{}' -> resolved='{}'", data.section, acroClass.getSection());
        log.info("9. Semester:         rawSemester='{}' -> resolved='{}'", data.semester, semester.getSemesterNumber());
        log.info("10. Academic Year:   rawYear='{}' -> resolved='{}'", data.academicYear, academicYear.getYear());
        log.info("11. Batch Year:      rawBatch='{}' -> mapped='{}'", data.batchYear, data.batchYear);
        log.info("12. Phone:           rawPhone='{}' -> mapped='{}'", data.mobileNumber, data.mobileNumber);
        log.info("13. Gender:          rawGender='{}' -> mapped='{}'", data.gender, data.gender);
        log.info("================================");

        boolean isUpdate = false;
        
        // Duplicate Checks
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode("AcroNexus@123")); // Default password
            user.setRole(UserRole.STUDENT);
            user.setCreatedBy(uploadedBy.getId());
        } else {
            if (user.getRole() != UserRole.STUDENT) {
                throw new IllegalArgumentException("Email already in use by a non-student user.");
            }
            isUpdate = true;
        }

        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setDepartment(department);
        user.setUpdatedBy(uploadedBy.getId());
        user.setIsDeleted(false); // Restore if previously soft-deleted
        
        if (data.mobileNumber != null && !data.mobileNumber.trim().isEmpty()) {
            user.setPhone(data.mobileNumber.trim());
        }
        
        if (data.status != null && !data.status.trim().isEmpty()) {
            user.setIsActive(data.status.trim().equalsIgnoreCase("ACTIVE"));
        } else {
            // Default to true if not specified
            user.setIsActive(true);
        }
        
        if (data.gender != null && !data.gender.trim().isEmpty()) {
            try {
                String gen = data.gender.trim().toUpperCase();
                if (gen.startsWith("M")) user.setGender(Gender.MALE);
                else if (gen.startsWith("F")) user.setGender(Gender.FEMALE);
                else user.setGender(Gender.OTHER);
            } catch (Exception e) {
                // Keep existing gender or leave null if unparseable
            }
        }
        if (data.personalEmail != null && !data.personalEmail.trim().isEmpty()) {
            user.setPersonalEmail(data.personalEmail.trim());
        }
        if (data.whatsappNumber != null && !data.whatsappNumber.trim().isEmpty()) {
            user.setWhatsappNumber(data.whatsappNumber.trim());
        }
        if (data.category != null && !data.category.trim().isEmpty()) {
            user.setCategory(data.category.trim());
        }
        if (data.religion != null && !data.religion.trim().isEmpty()) {
            user.setReligion(data.religion.trim());
        }
        if (data.nationality != null && !data.nationality.trim().isEmpty()) {
            user.setNationality(data.nationality.trim());
        }
        if (data.residenceType != null && !data.residenceType.trim().isEmpty()) {
            user.setResidenceType(data.residenceType.trim());
        }
        if (data.bloodGroup != null && !data.bloodGroup.trim().isEmpty()) {
            try {
                String bg = data.bloodGroup.trim().toUpperCase().replace("+", "_PLUS").replace("-", "_MINUS");
                user.setBloodGroup(BloodGroup.valueOf(bg));
            } catch (Exception e) {
                // Ignore unparseable blood group
            }
        }
        if (data.dob != null && !data.dob.trim().isEmpty()) {
            try {
                user.setDob(java.time.LocalDate.parse(data.dob.trim()));
            } catch (Exception e) {
                // Ignore unparseable dob
            }
        }

        user = userRepository.save(user);

        // Student Entity
        Student student = existingStudent;
        if (student != null && !student.getId().equals(user.getId())) {
            throw new IllegalArgumentException("Enrollment Number is already associated with a different email.");
        }
        
        if (student == null) {
            student = new Student();
            student.setId(user.getId());
            student.setUser(user);
            student.markAsNew();
        }
        student.setEnrollmentNo(data.enrollmentNo);
        student.setDegreeProgram(degreeProgram);
        student.setBatchYear(batchYearInput != null && !batchYearInput.isEmpty() ? batchYearInput : String.valueOf(java.time.LocalDate.now().getYear()));
        student.setCourse(acroClass.getName());
        student.setSection(acroClass.getSection());
        student.setCurrentSemester(String.valueOf(semester.getSemesterNumber()));
        if (data.rollNumber != null && !data.rollNumber.trim().isEmpty()) {
            student.setRollNo(data.rollNumber.trim());
        }
        if (data.admissionYear != null && !data.admissionYear.trim().isEmpty()) {
            student.setAdmissionYear(data.admissionYear.trim());
            student.setInstituteEnrollment(data.admissionYear.trim());
        } else if (data.batchYear != null && !data.batchYear.trim().isEmpty() && student.getAdmissionYear() == null) {
            student.setAdmissionYear(data.batchYear.trim());
        }
        if (data.hobbies != null && !data.hobbies.trim().isEmpty()) {
            student.setHobbies(data.hobbies.trim());
        }
        if (data.clubs != null && !data.clubs.trim().isEmpty()) {
            student.setClubs(data.clubs.trim());
        }
        student = studentRepository.save(student);

        // Student Enrollment Entity
        StudentEnrollment enrollment = studentEnrollmentRepository
                    .findFirstByStudentIdAndAcademicYearIdAndSemesterIdOrderByIdDesc(
                            student.getId(), academicYear.getId(), semester.getId())
                .orElse(new StudentEnrollment());
                
        if (enrollment.getId() == null) {
            enrollment.setCreatedBy(uploadedBy);
            enrollment.setEffectiveFrom(java.time.LocalDate.now());
            enrollment.setIsActive(true); // CRITICAL: Must be active to show up on UI!
        } else {
            isUpdate = true;
            if (enrollment.getIsActive() == null) {
                enrollment.setIsActive(true);
            }
        }
        enrollment.setStudent(student);
        enrollment.setAcademicYear(academicYear);
        enrollment.setSemester(semester);
        enrollment.setAcroClass(acroClass);
        studentEnrollmentRepository.save(enrollment);

        stats.successfulRecords++;
        if (isUpdate) {
            stats.updatedRecords++;
            stats.duplicateRecords++;
        }
        log.info("--- [DATA TRACE ROW {}] SUCCESS ---\n", rowNumber);
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf(cell.getNumericCellValue()).replaceAll("\\.0$", "");
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }

    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    private BulkUploadResponseDto buildResponseDto(BulkUpload upload, UploadStats stats, FileStorage fileStorage, long processingTimeMs) {
        BulkUploadResponseDto dto = new BulkUploadResponseDto();
        dto.setId(upload.getId());
        dto.setFileName(fileStorage.getFileName());
        dto.setFileType(fileStorage.getFileType());
        
        if (upload.getErrorLog() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> errLog = (Map<String, Object>) upload.getErrorLog();
            if (errLog.containsKey("fileSize")) {
                dto.setFileSize(((Number) errLog.get("fileSize")).longValue());
            }
        }
        
        if (upload.getUploadedBy() != null) {
            dto.setUploadedBy(upload.getUploadedBy().getFirstName() + " " + upload.getUploadedBy().getLastName());
        }
        
        dto.setProcessingTimeMs(processingTimeMs);
        dto.setProcessingStatus(upload.getProcessingStatus());
        dto.setTotalRecords(stats.totalRecords);
        dto.setSuccessfullyInserted(stats.successfulRecords - stats.updatedRecords);
        dto.setUpdatedRecords(stats.updatedRecords);
        dto.setFailedRecords(stats.failedRecords);
        dto.setSkippedRecords(stats.skippedRecords);
        dto.setDuplicateRecords(stats.duplicateRecords);
        dto.setErrorLog(stats.errors);
        dto.setUploadedAt(upload.getUploadedAt());
        dto.setCompletedAt(upload.getCompletedAt());
        return dto;
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
                    .setHeader("Row Number", "Enrollment No", "College Email", "Error Message")
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
    public AiStudentValidationResultDto validateStudentListWithAi(MultipartFile file, UUID uploadedByUserId) {
        List<Map<String, String>> rows = new ArrayList<>();

        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (filename.endsWith(".csv")) {
                CSVFormat csvFormat = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true).build();
                try (Reader reader = new InputStreamReader(file.getInputStream());
                     CSVParser csvParser = new CSVParser(reader, csvFormat)) {
                    for (CSVRecord record : csvParser) {
                        Map<String, String> rowMap = new LinkedHashMap<>();
                        for (String header : csvParser.getHeaderNames()) {
                            String cleanHeader = header.replace("\uFEFF", "").trim();
                            String mappedKey = mapToStandardKey(cleanHeader);
                            rowMap.put(mappedKey != null ? mappedKey : cleanHeader, record.get(header));
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
                            headers.add(getCellStringValue(cell).replace("\uFEFF", "").trim());
                        }
                    }
                    while (rowIterator.hasNext()) {
                        Row row = rowIterator.next();
                        if (isRowEmpty(row)) continue;
                        Map<String, String> rowMap = new LinkedHashMap<>();
                        for (int i = 0; i < headers.size(); i++) {
                            Cell cell = row.getCell(i);
                            String originalHeader = headers.get(i);
                            String mappedKey = mapToStandardKey(originalHeader);
                            rowMap.put(mappedKey != null ? mappedKey : originalHeader, getCellStringValue(cell));
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
            return AiStudentValidationResultDto.builder().totalAnalyzed(0).issuesFound(0).aiSummary("No data found in file.").issues(new ArrayList<>()).build();
        }

        // Cap the number of rows to avoid token limits for validation
        List<Map<String, String>> sampleRows = rows.size() > 50 ? rows.subList(0, 50) : rows;
        
        log.info("Starting AI validation for uploaded file: {}", file.getOriginalFilename());
        log.info("Extracted student count: {} (sampling {})", rows.size(), sampleRows.size());
        
        List<String> validAcademicYears = academicYearRepository.findAll().stream()
                .map(AcademicYear::getYear)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        List<String> validSemesters = semesterRepository.findAll().stream()
                .map(s -> String.valueOf(s.getSemesterNumber()))
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        List<String> validClasses = acroClassRepository.findAll().stream()
                .map(c -> c.getName() + "-" + c.getSection())
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        Map<String, Object> aiRequestData = new HashMap<>();
        aiRequestData.put("rows", sampleRows);
        aiRequestData.put("validAcademicYears", validAcademicYears);
        aiRequestData.put("validSemesters", validSemesters);
        aiRequestData.put("validClasses", validClasses);

        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("validationType", "STUDENT");
        aiRequest.put("data", aiRequestData);

        try {
            ObjectMapper mapper = new ObjectMapper();
            log.info("Data sent to AI service: {}", mapper.writeValueAsString(aiRequest));
            
            AiStudentValidationResultDto result = aiService.validateData(aiRequest, AiStudentValidationResultDto.class);
            if (result == null) {
                result = AiStudentValidationResultDto.builder()
                        .totalAnalyzed(sampleRows.size())
                        .issuesFound(1)
                        .aiSummary("Failed to process AI validation. Backend service returned null.")
                        .issues(List.of(AiStudentValidationResultDto.AiValidationIssue.builder()
                                .rowNumber(0)
                                .field("System")
                                .issueDescription("AI service unavailable or returned invalid format")
                                .build()))
                        .build();
            }
            result.setRawRecords(new ArrayList<>(rows));
            result.setTotalAnalyzed(rows.size());
            
            int errorCount = result.getIssuesFound();
            result.setErrorCount(errorCount);
            result.setWarningCount(0);
            result.setValidCount(Math.max(0, rows.size() - errorCount));
            log.info("AI validation successful. Issues found: {}. Total raw records returned: {}", result.getIssuesFound(), rows.size());
            return result;
        } catch (Exception e) {
            String errorMsg = "AI validation failed: " + e.getMessage();
            log.error("Actual exception message: {}", e.getMessage(), e);
            throw new RuntimeException(errorMsg, e);
        }
    }

    private static class UploadStats {
        int totalRecords = 0;
        int successfulRecords = 0;
        int failedRecords = 0;
        int updatedRecords = 0;
        int skippedRecords = 0;
        int duplicateRecords = 0;
        List<UploadErrorDto> errors = new ArrayList<>();

        void addError(UploadErrorDto error) {
            errors.add(error);
        }
    }

    private String mapToStandardKey(String header) {
        String normalized = normalizeHeader(header);
        if (normalized.isEmpty()) return null;
        if (List.of("studentname", "name", "student", "fullname").contains(normalized) || normalized.contains("studentname") || normalized.equals("student") || normalized.startsWith("name")) return "studentName";
        if (List.of("enrollmentno", "enrollmentnumber", "enrollment", "rgpvenrollment").contains(normalized) || (normalized.contains("enrollment") && !normalized.contains("institute"))) return "enrollmentNumber";
        if (List.of("rollno", "rollnumber", "roll", "classrollno").contains(normalized) || normalized.equals("roll") || normalized.equals("rollno")) return "rollNumber";
        if (List.of("admissionyear", "yearofadmission", "instituteenrollment", "instituteenrollmentno").contains(normalized) || normalized.contains("admission") || normalized.contains("instituteenrollment")) return "admissionYear";
        if (List.of("collegeemail", "email", "emailid", "emailaddress").contains(normalized) || (normalized.contains("email") && !normalized.contains("personal"))) return "collegeEmail";
        if (List.of("personalemail", "alternateemail", "personalemailid").contains(normalized) || normalized.contains("personalemail")) return "personalEmail";
        if (List.of("whatsappnumber", "whatsapp", "whatsappno").contains(normalized) || normalized.contains("whatsapp")) return "whatsappNumber";
        if (List.of("dob", "dateofbirth", "birthdate").contains(normalized) || normalized.equals("dob") || normalized.contains("dateofbirth") || normalized.contains("birth")) return "dob";
        if (List.of("category", "castecategory", "caste").contains(normalized) || normalized.equals("category")) return "category";
        if (List.of("religion", "community").contains(normalized) || normalized.equals("religion")) return "religion";
        if (List.of("nationality", "country").contains(normalized) || normalized.equals("nationality")) return "nationality";
        if (List.of("residencetype", "residence", "hosteller", "dayscholar", "staytype").contains(normalized) || normalized.contains("residence")) return "residenceType";
        if (List.of("bloodgroup", "blood").contains(normalized) || normalized.contains("blood")) return "bloodGroup";
        if (List.of("hobbies", "interests").contains(normalized) || normalized.contains("hobbies") || normalized.contains("interests")) return "hobbies";
        if (List.of("clubs", "communities", "groups").contains(normalized) || normalized.contains("clubs") || normalized.contains("communities")) return "clubs";
        if (List.of("gender", "sex").contains(normalized) || normalized.equals("gender") || normalized.equals("sex")) return "gender";
        
        // CAREFUL WITH THESE: ORDER MATTERS
        if (List.of("section", "sec", "batchsection").contains(normalized) || normalized.equals("section") || normalized.equals("sec")) return "section";
        if (List.of("batch", "batchyear").contains(normalized) || (normalized.contains("batch") && !normalized.contains("section"))) return "batchYear";
        if (List.of("academicyear", "year").contains(normalized) || normalized.equals("year") || (normalized.contains("year") && !normalized.contains("batch") && !normalized.contains("admission"))) return "academicYear";
        if (List.of("semester", "sem", "currentsemester").contains(normalized) || normalized.equals("sem") || normalized.contains("semester")) return "semester";
        if (List.of("class", "course", "acroclass", "program").contains(normalized) || normalized.equals("class") || normalized.equals("course")) return "acroClass";
        if (List.of("mobilenumber", "phone", "mobile", "contact", "phonenumber", "contactnumber").contains(normalized) || normalized.contains("mobile") || normalized.contains("phone") || normalized.contains("contact")) return "mobileNumber";
        if (List.of("status", "isactive", "active", "currentstatus", "studentstatus", "userstatus").contains(normalized) || normalized.contains("status")) return "status";
        if (List.of("department", "dept", "branch", "stream", "discipline").contains(normalized) || normalized.contains("department") || normalized.equals("dept") || normalized.contains("branch")) return "department";
        if (List.of("degree", "degreeprogram", "degreeprogramme", "program", "programme", "course", "branch").contains(normalized) || normalized.contains("degree")) return "degree";
        return null; // Return null if not mapped, so we keep original
    }

    private record StudentRowData(
            String studentName, String enrollmentNo, String collegeEmail,
            String gender, String batchYear, String academicYear, String semester,
            String acroClass, String section, String mobileNumber, String status, String department, String degree,
            String rollNumber, String admissionYear, String personalEmail, String whatsappNumber,
            String dob, String category, String religion, String nationality, String residenceType,
            String bloodGroup, String hobbies, String clubs
    ) {}
}
