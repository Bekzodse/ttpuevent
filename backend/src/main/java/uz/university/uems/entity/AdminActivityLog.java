package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "admin_activity_logs",
    indexes = {
        @Index(name = "idx_admin_activity_created", columnList = "created_at"),
        @Index(name = "idx_admin_activity_target", columnList = "target_type, action_type")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_username", nullable = false, length = 60)
    private String actorUsername;

    @Column(name = "actor_full_name", nullable = false, length = 160)
    private String actorFullName;

    @Column(name = "action_type", nullable = false, length = 60)
    private String actionType;

    @Column(name = "target_type", nullable = false, length = 40)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "target_label", length = 200)
    private String targetLabel;

    @Column(name = "details", length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}
