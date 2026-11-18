package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
    name = "hall_schedule_blocks",
    indexes = {
        @Index(name = "idx_schedule_hall_date", columnList = "hall_id, block_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HallScheduleBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hall_id", nullable = false)
    private EventHall hall;

    @Column(name = "block_date", nullable = false)
    private LocalDate blockDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "block_type", nullable = false, length = 40)
    @Builder.Default
    private String blockType = "MAINTENANCE";

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(name = "created_by", nullable = false, length = 60)
    private String createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}
