package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "notifications",
    indexes = {
        @Index(name = "idx_notif_recipient", columnList = "recipient_id, is_read, created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "INFO";

    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "application_code", length = 40)
    private String applicationCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", length = 30)
    private BookingStatus bookingStatus;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}
