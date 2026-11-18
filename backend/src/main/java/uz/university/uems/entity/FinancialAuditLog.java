package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "financial_audit_logs",
    indexes = {
        @Index(name = "idx_fin_audit_created", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id")
    private Long applicationId;

    @Column(name = "application_code", length = 40)
    private String applicationCode;

    @Column(name = "cancellation_request_id")
    private Long cancellationRequestId;

    @Column(name = "actor_username", nullable = false, length = 60)
    private String actorUsername;

    @Column(name = "actor_role", nullable = false, length = 30)
    private String actorRole;

    @Column(name = "action_type", nullable = false, length = 60)
    private String actionType;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "transaction_reference", length = 120)
    private String transactionReference;

    @Column(length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = Instant.now();
    }
}
