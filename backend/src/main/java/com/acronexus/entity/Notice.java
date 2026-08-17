package com.acronexus.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.ZonedDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "notices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notice {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String title;
    private String description;
    private String category;
    @Enumerated(EnumType.STRING)
    private NoticePriority priority;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id")
    private FileStorage file;
    @CreationTimestamp
    private ZonedDateTime publishDate;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by")
    private User publishedBy;
    private Boolean isActive = true;
    private Boolean isDeleted = false;
    private ZonedDateTime expiryDate;
    
    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<NoticeTargetAssignment> targetAssignments = new java.util.ArrayList<>();
}