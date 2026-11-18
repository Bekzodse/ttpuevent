package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "application_history",
    indexes = {
        @Index(name = "idx_history_app_id", columnList = "application_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private HallApplication application;

    @Column(name = "actor_username", nullable = false, length = 60)
    private String actorUsername;

    @Column(name = "actor_full_name", nullable = false, length = 160)
    private String actorFullName;

    @Column(name = "actor_role", nullable = false, length = 30)
    private String actorRole;

    @Column(name = "action", nullable = false, length = 60)
    private String action;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private BookingStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 30)
    private BookingStatus newStatus;

    @Column(name = "comment", length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}
