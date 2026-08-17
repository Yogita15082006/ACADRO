package com.acronexus.service.impl;

import com.acronexus.dto.ExaminationNoticeRequestDto;
import com.acronexus.dto.ExaminationNoticeResponseDto;
import com.acronexus.entity.Examination;
import com.acronexus.entity.ExaminationNotice;
import com.acronexus.exception.ResourceNotFoundException;
import com.acronexus.mapper.ExaminationNoticeMapper;
import com.acronexus.repository.ExaminationNoticeRepository;
import com.acronexus.repository.ExaminationRepository;
import com.acronexus.service.ExaminationNoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import com.acronexus.repository.FileStorageRepository;
import com.acronexus.repository.UserRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExaminationNoticeServiceImpl implements ExaminationNoticeService {

    private final ExaminationNoticeRepository repository;
    private final ExaminationRepository examinationRepository;
    private final ExaminationNoticeMapper mapper;
    private final FileStorageRepository fileStorageRepository;
    private final UserRepository userRepository;
    
    private static final String UPLOAD_DIR = "uploads/examination-notices/";

    @Override
    @Transactional
    public ExaminationNoticeResponseDto create(ExaminationNoticeRequestDto requestDto) {
        Examination examination = examinationRepository.findByIdAndIsDeletedFalse(requestDto.getExaminationId())
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
        
        ExaminationNotice entity = mapper.toEntity(requestDto);
        entity.setExamination(examination);
        
        return mapper.toDto(repository.save(entity));
    }
    
    @Override
    @Transactional
    public ExaminationNoticeResponseDto update(UUID id, ExaminationNoticeRequestDto requestDto) {
        ExaminationNotice entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
                
        Examination examination = examinationRepository.findByIdAndIsDeletedFalse(requestDto.getExaminationId())
                .orElseThrow(() -> new ResourceNotFoundException("Examination not found"));
                
        entity.setExamination(examination);
        entity.setTitle(requestDto.getTitle());
        entity.setDescription(requestDto.getDescription());
        entity.setCategory(requestDto.getCategory());
        entity.setPriority(requestDto.getPriority());
        entity.setPublishDate(requestDto.getPublishDate());
        entity.setAttachmentFileId(requestDto.getAttachmentFileId());
        
        return mapper.toDto(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExaminationNoticeResponseDto> getByExaminationId(UUID examinationId) {
        return repository.findByExaminationIdOrderByPublishDateDesc(examinationId).stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        ExaminationNotice entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notice not found"));
        repository.delete(entity);
    }
    
    @Override
    @Transactional
    public UUID uploadAttachment(MultipartFile file, UUID currentUserId) {
        try {
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(UPLOAD_DIR);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            java.nio.file.Path filePath = uploadPath.resolve(fileName);
            java.nio.file.Files.copy(file.getInputStream(), filePath);

            com.acronexus.entity.FileStorage fs = new com.acronexus.entity.FileStorage();
            fs.setFileName(file.getOriginalFilename());
            fs.setDocumentUrl(filePath.toString());
            fs.setFileType(file.getContentType());
            fs.setUploadedBy(userRepository.findById(currentUserId).orElse(null));
            fs.setUploadedAt(java.time.ZonedDateTime.now());
            fs.setIsActive(true);
            fs.setIsDeleted(false);
            fs = fileStorageRepository.save(fs);
            return fs.getId();
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store notice attachment", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> downloadAttachment(UUID fileId) {
        com.acronexus.entity.FileStorage fs = fileStorageRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
        try {
            java.nio.file.Path path = java.nio.file.Paths.get(fs.getDocumentUrl());
            byte[] fileBytes = java.nio.file.Files.readAllBytes(path);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fs.getFileName() + "\"");
            
            String mimeType = fs.getFileType();
            if (mimeType == null) {
                mimeType = "application/octet-stream";
            }
            headers.setContentType(MediaType.parseMediaType(mimeType));
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(fileBytes);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error reading file", e);
        }
    }
}
