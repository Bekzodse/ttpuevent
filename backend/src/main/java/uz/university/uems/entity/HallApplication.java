package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
    name = "hall_applications",
    indexes = {
        @Index(name = "idx_app_code", columnList = "application_code"),
        @Index(name = "idx_app_applicant", columnList = "applicant_id"),
        @Index(name = "idx_app_hall_date", columnList = "hall_id, event_date"),
        @Index(name = "idx_app_status", columnList = "status"),
        @Index(name = "idx_app_deadline", columnList = "payment_deadline")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HallApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_code", nullable = false, unique = true, length = 40)
    private String applicationCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @Column(name = "applicant_first_name", nullable = false, length = 80)
    private String applicantFirstName;

    @Column(name = "applicant_last_name", nullable = false, length = 80)
    private String applicantLastName;

    @Column(name = "applicant_phone_number", nullable = false, length = 20)
    private String applicantPhoneNumber;

    @Column(name = "applicant_email", length = 160)
    private String applicantEmail;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hall_id", nullable = false)
    private EventHall hall;

    @Column(name = "event_name", nullable = false, length = 160)
    private String eventName;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "expected_participants", nullable = false)
    private Integer expectedParticipants;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    private BookingStatus paymentStatus;

    @Column(name = "admin_comment", length = 1000)
    private String adminComment;

    @Column(name = "user_reply", length = 1500)
    private String userReply;

    @Column(name = "required_amount", precision = 12, scale = 2)
    private BigDecimal requiredAmount;

    @Column(name = "bank_card_number", length = 40)
    private String bankCardNumber;

    @Column(name = "bank_card_holder", length = 120)
    private String bankCardHolder;

    @Column(name = "bank_name", length = 120)
    private String bankName;

    @Column(name = "receipt_filename", length = 255)
    private String receiptFilename;

    @Column(name = "receipt_uploaded_at")
    private Instant receiptUploadedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "payment_deadline")
    private Instant paymentDeadline;

    @Column(name = "payment_verified_at")
    private Instant paymentVerifiedAt;

    @Column(name = "verified_by_admin", length = 120)
    private String verifiedByAdmin;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
