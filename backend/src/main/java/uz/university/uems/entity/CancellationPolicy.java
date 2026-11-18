package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "cancellation_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String name = "Standard University Cancellation Policy";

    @Column(name = "full_refund_hours_before", nullable = false)
    @Builder.Default
    private Integer fullRefundHoursBefore = 48;

    @Column(name = "partial_refund_hours_before", nullable = false)
    @Builder.Default
    private Integer partialRefundHoursBefore = 24;

    @Column(name = "partial_refund_percent", nullable = false)
    @Builder.Default
    private Integer partialRefundPercent = 50;

    @Column(name = "release_hall_on_approval", nullable = false)
    @Builder.Default
    private boolean releaseHallOnApproval = true;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = Instant.now();
    }
}
