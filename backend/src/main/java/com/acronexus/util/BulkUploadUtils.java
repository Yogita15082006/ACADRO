package com.acronexus.util;

import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;

import com.acronexus.dto.BulkUploadResponseDto;
import com.acronexus.dto.UploadStats;
import com.acronexus.entity.BulkUpload;
import com.acronexus.entity.FileStorage;

import java.util.Map;

public class BulkUploadUtils {

    public static String getSafeCsv(CSVRecord record, String header) {
        if (record.isMapped(header)) return record.get(header);
        if (record.isMapped(header.toLowerCase())) return record.get(header.toLowerCase());
        return "";
    }

    public static String getSafeExcel(Row row, Map<String, Integer> headerMap, String headerName) {
        Integer idx = headerMap.get(headerName.toLowerCase());
        if (idx == null) return "";
        return getCellStringValue(row.getCell(idx));
    }

    public static String getCellStringValue(Cell cell) {
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

    public static boolean isRowEmpty(Row row) {
        if (row == null) return true;
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                return false;
            }
        }
        return true;
    }

    public static BulkUploadResponseDto buildResponseDto(BulkUpload upload, UploadStats stats, FileStorage fileStorage, long processingTimeMs) {
        BulkUploadResponseDto dto = new BulkUploadResponseDto();
        dto.setId(upload.getId());
        if (fileStorage != null) {
            dto.setFileName(fileStorage.getFileName());
            dto.setFileType(fileStorage.getFileType());
        } else {
            dto.setFileName("API_IMPORT.json");
            dto.setFileType("application/json");
        }
        
        if (upload.getErrorLog() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> errLog = (Map<String, Object>) upload.getErrorLog();
            if (errLog.containsKey("fileSize")) {
                dto.setFileSize(((Number) errLog.get("fileSize")).longValue());
            }
        }
        
        if (upload.getUploadedBy() != null) {
            try {
                dto.setUploadedBy(upload.getUploadedBy().getFirstName() + " " + upload.getUploadedBy().getLastName());
            } catch (Exception e) {
                dto.setUploadedBy("System User");
            }
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
}
