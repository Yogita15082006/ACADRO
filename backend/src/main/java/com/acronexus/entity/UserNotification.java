package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "user_notifications", indexes = {
    @Index(name = "idx_user_notif_user", columnList = "user_id"),
    @Index(name = "idx_user_notif_user_read", columnList = "user_id, is_read"),
    @Index(name = "idx_user_notif_user_created", columnList = "user_id, created_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 50)
    private String module;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(length = 255)
    private String actionPath;

    @Column(length = 50)
    private String type;

    @Column(name = "is_read")
    private Boolean isRead = false;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private java.time.Instant createdAt;

    @Column(name = "read_at")
    private java.time.Instant readAt;

    @Column(name = "reference_id", length = 255)
    private String referenceId;
}
