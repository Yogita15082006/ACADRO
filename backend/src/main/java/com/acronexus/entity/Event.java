package com.acronexus.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(name = "category")
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String venue;

    @Column(name = "event_date")
    private Instant eventDate;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Column(name = "mode")
    private String mode; // Offline, Online, Hybrid

    @Column(name = "location_link")
    private String locationLink;

    @Column(name = "registration_start")
    private Instant registrationStart;

    @Column(name = "registration_end")
    private Instant registrationEnd;

    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "registration_fee")
    private Double registrationFee;

    @Column(name = "allow_waiting_list")
    @Builder.Default
    private Boolean allowWaitingList = false;

    @Column(name = "include_in_overall_attendance")
    @Builder.Default
    private Boolean includeInOverallAttendance = false;

    @Column(name = "registration_method")
    private String registrationMethod; // Manually, Via AI

    @Column(name = "registration_external_link")
    private String registrationExternalLink;

    @Column(name = "ai_registration_form_config", columnDefinition = "TEXT")
    private String aiRegistrationFormConfig;

    @Column(name = "rules_and_guidelines", columnDefinition = "TEXT")
    private String rulesAndGuidelines;

    @Column(name = "status")
    @Builder.Default
    private String status = "UPCOMING"; // UPCOMING, ONGOING, CLOSED

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_class_id")
    private AcroClass targetClass;

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EventTargetAssignment> targetAssignments = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EventAttendanceSession> attendanceSessions = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EventNotice> notices = new java.util.ArrayList<>();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<EventRegistration> registrations = new java.util.ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poster_file_id")
    private FileStorage posterFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_qr_file_id")
    private FileStorage paymentQrFile;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

}
