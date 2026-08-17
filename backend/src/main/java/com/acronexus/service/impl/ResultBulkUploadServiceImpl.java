package com.acronexus.service.impl;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.dto.UploadErrorDto;
import com.acronexus.entity.*;
import com.acronexus.repository.*;
import com.acronexus.service.ResultBulkUploadService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResultBulkUploadServiceImpl implements ResultBulkUploadService {

    private final BulkUploadRepository bulkUploadRepository;
    private final FileStorageRepository fileStorageRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SemesterRepository semesterRepository;
    private final ExaminationRepository examinationRepository;
    private final ExamResultRepository examResultRepository;
    private final ExamResultsHistoryRepository examResultsHistoryRepository;
    private final TransactionTemplate transactionTemplate;

    @Override
    public BulkUploadResponseDto uploadResultList(MultipartFile file, UUID uploadedByUserId, UUID examinationId, String className) {
        Instant startTime = Instant.now();
        User uploadedBy = userRepository.findById(uploadedByUserId)
                .orElseThrow(() -> new IllegalArgumentException("Uploader not found"));

        FileStorage fileStorage = new FileStorage();
        fileStorage.setFileName(file.getOriginalFilename());
        fileStorage.setFileType(file.getContentType());
        fileStorage.setDocumentUrl("local-storage://" + UUID.randomUUID() + "-" + file.getOriginalFilename());
        fileStorage.setUploadedBy(uploadedBy);
        fileStorage.setUploadedAt(ZonedDateTime.now());
        fileStorage = fileStorageRepository.save(fileStorage);

        BulkUpload bulkUpload = new BulkUpload();
        bulkUpload.setUploadType(UploadType.RESULT);
        bulkUpload.setFile(fileStorage);
        bulkUpload.setProcessingStatus(ProcessingStatus.PROCESSING);
        bulkUpload.setUploadedBy(uploadedBy);
        bulkUpload = bulkUploadRepository.save(bulkUpload);

        UploadStats stats = new UploadStats();

        try {
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            if (filename.endsWith(".csv")) {
                processCsv(file, uploadedBy, stats, examinationId, className);
            } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                processExcel(file, uploadedBy, stats, examinationId, className);
            } else {
                throw new IllegalArgumentException("Unsupported file format. Please upload .csv or Excel files.");
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

    private String normalizeHeader(String header) {
        if (header == null) return "";
        return header.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private String getSafeValue(Row row, org.apache.commons.csv.CSVRecord csvRecord, Map<String, Integer> excelHeaderMap, Map<String, String> csvHeaderMap, String... aliases) {
        for (String alias : aliases) {
            String norm = normalizeHeader(alias);
            if (row != null && excelHeaderMap != null) {
                Integer idx = excelHeaderMap.get(norm);
                if (idx != null) {
                    return getCellStringValue(row.getCell(idx));
                }
            } else if (csvRecord != null && csvHeaderMap != null) {
                String val = csvHeaderMap.get(norm);
                if (val != null) {
                    return val;
                }
            }
        }
        return "";
    }

    private void processExcel(MultipartFile file, User uploadedBy, UploadStats stats, UUID examinationId, String className) throws Exception {
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            Map<String, Integer> headerMap = new HashMap<>();
            List<String> rawHeaders = new ArrayList<>();
            if (rows.hasNext()) {
                Row headerRow = rows.next();
                for (Cell cell : headerRow) {
                    String val = getCellStringValue(cell);
                    rawHeaders.add(val);
                    headerMap.put(normalizeHeader(val), cell.getColumnIndex());
                }
            }

            processRowsDynamic(rows, null, headerMap, null, rawHeaders, uploadedBy, stats, examinationId, className);
        }
    }

    private void processCsv(MultipartFile file, User uploadedBy, UploadStats stats, UUID examinationId, String className) throws Exception {
        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             org.apache.commons.csv.CSVParser csvParser = new org.apache.commons.csv.CSVParser(fileReader,
                     org.apache.commons.csv.CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).setTrim(true).build())) {

            Map<String, String> headerMap = new HashMap<>();
            List<String> rawHeaders = new ArrayList<>();
            for (String header : csvParser.getHeaderNames()) {
                rawHeaders.add(header);
                headerMap.put(normalizeHeader(header), header);
            }

            processRowsDynamic(null, csvParser.iterator(), null, headerMap, rawHeaders, uploadedBy, stats, examinationId, className);
        }
    }

    private void processRowsDynamic(
            Iterator<Row> excelRows,
            Iterator<org.apache.commons.csv.CSVRecord> csvRows,
            Map<String, Integer> excelHeaderMap,
            Map<String, String> csvHeaderMap,
            List<String> rawHeaders,
            User uploadedBy, UploadStats stats, java.util.UUID examinationId, String className
    ) {
        boolean hasGenericMarks = false;
        for (String alias : new String[]{"obtainedmarks", "marks", "obtained", "score", "totalmarks", "marksobtained"}) {
            if (excelHeaderMap != null && excelHeaderMap.containsKey(alias)) hasGenericMarks = true;
            if (csvHeaderMap != null && csvHeaderMap.containsKey(alias)) hasGenericMarks = true;
        }

        int rowNumber = 1;
        while ((excelRows != null && excelRows.hasNext()) || (csvRows != null && csvRows.hasNext())) {
            Row row = excelRows != null && excelRows.hasNext() ? excelRows.next() : null;
            org.apache.commons.csv.CSVRecord csvRecord = csvRows != null && csvRows.hasNext() ? csvRows.next() : null;
            rowNumber++;
            
            if (row != null && isRowEmpty(row)) continue;

            try {
                String studentName = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "studentname", "name");
                String enrollmentNo = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "enrollmentno", "enrollmentnumber", "rollno", "studentid", "enrollment", "enrolmentno");
                String collegeEmail = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "collegeemail", "email", "emailaddress");
                String branch = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "branch", "department", "dept");
                String batch = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "batch", "batchyear");
                String academicYear = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "academicyear", "year");
                String semester = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "semester", "sem", "semesterid");
                String clazz = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "class", "section", "div", "classid");
                String examType = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "examtype", "type");
                
                if (hasGenericMarks) {
                    stats.totalRecords++;
                    String subjectCode = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "subjectcode", "code", "coursecode", "subject");
                    String subjectName = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "subjectname");
                    String maxMarks = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "maxmarks", "maximummarks", "outof", "total", "maxscore");
                    String obtainedMarks = getSafeValue(row, csvRecord, excelHeaderMap, csvHeaderMap, "obtainedmarks", "marks", "obtained", "score", "totalmarks", "marksobtained");

                    ResultRowData rowData = new ResultRowData(studentName, enrollmentNo, collegeEmail, branch, batch, academicYear, semester, clazz, subjectCode, subjectName, examType, maxMarks, obtainedMarks);
                    executeRowInTransaction(rowNumber, rowData, uploadedBy, stats, examinationId, className);
                } else {
                    List<String> standardCols = List.of("studentname", "name", "enrollmentno", "enrollmentnumber", "rollno", "studentid", "enrollment", "enrolmentno", "collegeemail", "email", "emailaddress", "branch", "department", "dept", "batch", "batchyear", "academicyear", "year", "semester", "sem", "semesterid", "class", "section", "div", "classid", "examtype", "type");
                    boolean foundAnySubject = false;

                    for (String rawHeader : rawHeaders) {
                        String norm = normalizeHeader(rawHeader);
                        if (standardCols.contains(norm)) continue;
                        
                        String cellVal;
                        if (row != null && excelHeaderMap != null) {
                            Integer idx = excelHeaderMap.get(norm);
                            cellVal = (idx != null) ? getCellStringValue(row.getCell(idx)) : "";
                        } else {
                            cellVal = (csvRecord != null && csvRecord.isSet(rawHeader)) ? csvRecord.get(rawHeader) : "";
                        }
                        
                        if (cellVal == null || cellVal.trim().isEmpty()) continue;
                        
                        stats.totalRecords++;
                        foundAnySubject = true;
                        String subjName = rawHeader;
                        if (norm.endsWith("marks")) {
                            subjName = rawHeader.substring(0, rawHeader.toLowerCase().lastIndexOf("marks")).trim();
                        }
                        if (norm.endsWith("score")) {
                            subjName = rawHeader.substring(0, rawHeader.toLowerCase().lastIndexOf("score")).trim();
                        }

                        ResultRowData rowData = new ResultRowData(studentName, enrollmentNo, collegeEmail, branch, batch, academicYear, semester, clazz, "", subjName, examType, "100", cellVal);
                        executeRowInTransaction(rowNumber, rowData, uploadedBy, stats, examinationId, className);
                    }
                    if (!foundAnySubject && !enrollmentNo.isEmpty()) {
                        stats.failedRecords++;
                        stats.addError(new UploadErrorDto(rowNumber, enrollmentNo, "", "No valid subject marks found in this row. Ensure columns are named correctly."));
                    }
                }
            } catch (Exception e) {
                stats.failedRecords++;
                stats.addError(new UploadErrorDto(rowNumber, "", "", "Invalid row structure: " + e.getMessage()));
            }
        }
    }

    private void executeRowInTransaction(int rowNumber, ResultRowData data, User uploadedBy, UploadStats stats, UUID examinationId, String className) {
        transactionTemplate.execute(status -> {
            try {
                processRow(rowNumber, data, uploadedBy, stats, examinationId, className);
                return null;
            } catch (Exception e) {
                status.setRollbackOnly();
                stats.failedRecords++;
                stats.addError(new UploadErrorDto(rowNumber, data.enrollmentNo, data.subjectCode, e.getMessage()));
                return null;
            }
        });
    }

    private void processRow(int rowNumber, ResultRowData data, User uploadedBy, UploadStats stats, UUID examinationId, String className) {
        if (data.enrollmentNo.isEmpty()) {
            throw new IllegalArgumentException("Enrollment No is strictly required.");
        }
        if (data.marksObtained.isEmpty()) {
            throw new IllegalArgumentException("Obtained Marks is strictly required.");
        }

        Student student = studentRepository.findByEnrollmentNo(data.enrollmentNo)
                .orElseThrow(() -> new IllegalArgumentException("Student with Enrollment No '" + data.enrollmentNo + "' not found."));

        Examination examination = null;
        if (examinationId != null) {
            examination = examinationRepository.findById(examinationId)
                    .orElseThrow(() -> new IllegalArgumentException("Examination not found: " + examinationId));
        } else {
            AcademicYear academicYear;
            if (!data.academicYear.isEmpty()) {
                academicYear = academicYearRepository.findByYear(data.academicYear)
                        .orElseThrow(() -> new IllegalArgumentException("Academic Year not found: " + data.academicYear));
            } else {
                 academicYear = academicYearRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("No Academic Year available."));
            }

            Semester semester;
            if (!data.semester.isEmpty()) {
                int finalSemNumber;
                try {
                    finalSemNumber = (int) Double.parseDouble(data.semester);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid Semester Number: " + data.semester);
                }
                semester = semesterRepository.findBySemesterNumberAndAcademicYearId(finalSemNumber, academicYear.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Semester not found: " + finalSemNumber + " in year " + data.academicYear));
            } else {
                semester = semesterRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("No Semester available."));
            }

            ExamType type = ExamType.END_TERM;
            if (!data.examType.isEmpty()) {
                try {
                    String rawType = data.examType.toUpperCase().replace(" ", "_");
                    if (rawType.equals("END_SEM") || rawType.equals("END SEM")) {
                        rawType = "END_TERM";
                    }
                    type = ExamType.valueOf(rawType);
                } catch (IllegalArgumentException e) {
                    throw new IllegalArgumentException("Invalid Exam Type: " + data.examType);
                }
            }

            Department department = student.getUser().getDepartment();

            final ExamType finalType = type;
            final Semester finalSemester = semester;
            final AcademicYear finalAcademicYear = academicYear;

            examination = examinationRepository.findByDepartmentIdAndSemesterIdAndType(department.getId(), finalSemester.getId(), finalType)
                    .orElseGet(() -> {
                        Examination newExam = new Examination();
                        newExam.setDepartment(department);
                        newExam.setSemester(finalSemester);
                        newExam.setType(finalType);
                        newExam.setName(finalAcademicYear.getYear() + " " + finalType.name() + " - " + department.getCode());
                        newExam.setStatus(ExamStatus.COMPLETED);
                        return examinationRepository.save(newExam);
                    });
        }

        Subject subject = null;
        if (data.subjectCode != null && !data.subjectCode.isEmpty()) {
            subject = subjectRepository.findByCode(data.subjectCode).orElse(null);
        }
        if (subject == null && data.subjectName != null && !data.subjectName.isEmpty()) {
            subject = subjectRepository.findAll().stream()
                    .filter(s -> s.getName().equalsIgnoreCase(data.subjectName) || s.getCode().equalsIgnoreCase(data.subjectName))
                    .findFirst()
                    .orElse(null);
        }
        if (subject == null) {
            throw new IllegalArgumentException("Subject '" + (data.subjectCode.isEmpty() ? data.subjectName : data.subjectCode) + "' not found in database.");
        }

        BigDecimal marksObtained, maxMarks;
        try {
            marksObtained = new BigDecimal(data.marksObtained);
            maxMarks = data.maxMarks.isEmpty() ? new BigDecimal("100") : new BigDecimal(data.maxMarks);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Marks Obtained and Maximum Marks must be valid numeric values.");
        }

        boolean isUpdate = false;
        ExamResult result = examResultRepository.findByExaminationIdAndStudentIdAndSubjectId(examination.getId(), student.getId(), subject.getId())
                .orElse(null);

        if (result == null) {
            result = new ExamResult();
            result.setExamination(examination);
            result.setStudent(student);
            result.setSubject(subject);
        } else {
            isUpdate = true;
            if (result.getMarksObtained().compareTo(marksObtained) != 0) {
                ExamResultsHistory history = new ExamResultsHistory();
                history.setResult(result);
                history.setPreviousMarksObtained(result.getMarksObtained());
                history.setNewMarksObtained(marksObtained);
                history.setModificationReason("Bulk Upload Update");
                history.setModifiedBy(uploadedBy);
                examResultsHistoryRepository.save(history);
            }
        }

        result.setMarksObtained(marksObtained);
        result.setMaxMarks(maxMarks);

        examResultRepository.save(result);

        stats.successfulRecords++;
        if (isUpdate) {
            stats.updatedRecords++;
            stats.duplicateRecords++;
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                }
                yield String.valueOf(cell.getNumericCellValue()).replaceAll("\\.0$", "");
            }
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
                    .setHeader("Row Number", "Enrollment No", "Subject Code", "Error Message")
                    .build();
            try (CSVPrinter printer = new CSVPrinter(new PrintWriter(out), csvFormat)) {
                for (Map<String, Object> err : errors) {
                    printer.printRecord(err.get("rowNumber"), err.get("referenceId"), err.get("emailOrDepartment"), err.get("errorMessage"));
                }
            }
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate error report CSV for upload {}", uploadId, e);
            throw new RuntimeException("Failed to generate error report", e);
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

    private record ResultRowData(
            String studentName, String enrollmentNo, String collegeEmail, String branch, String batch,
            String academicYear, String semester, String className, String subjectCode, String subjectName,
            String examType, String maxMarks, String marksObtained
    ) {}
}
