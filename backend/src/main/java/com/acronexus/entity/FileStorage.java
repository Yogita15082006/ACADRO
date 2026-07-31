package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;
import java.util.UUID;
import java.time.ZonedDateTime;

@Entity
@Table(name = "file_storage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FileStorage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String fileName;
    private String documentUrl;
    private String fileType;
    private String mimeType;
    private String parsedContent;
    @JdbcTypeCode(SqlTypes.JSON)
    private String aiMetadata;
    @JdbcTypeCode(SqlTypes.ARRAY)
    private List<Float> contentEmbedding;
    private Integer versionNumber = 1;
    private Boolean isActive = true;
    private Boolean isDeleted = false;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
    private ZonedDateTime uploadedAt;
}