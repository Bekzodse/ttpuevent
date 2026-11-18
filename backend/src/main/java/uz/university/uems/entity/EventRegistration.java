package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(
    name = "event_registrations",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_event_user", columnNames = {"event_id", "user_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private UniversityEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt;

    @PrePersist
    protected void onCreate() {
        if (this.registeredAt == null) {
            this.registeredAt = Instant.now();
        }
    }
}
