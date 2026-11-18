package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "cancellation_requests",
    indexes = {
        @Index(name = "idx_cancel_req_status", columnList = "status, refund_status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancellationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private HallApplication application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private CancellationStatus status = CancellationStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 30)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.NOT_APPLICABLE;

    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "eligible_refund_percent", nullable = false)
    @Builder.Default
    private Integer eligibleRefundPercent = 0;

    @Column(name = "eligible_refund_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal eligibleRefundAmount = BigDecimal.ZERO;

    @Column(name = "approved_refund_amount", precision = 12, scale = 2)
    private BigDecimal approvedRefundAmount;

    @Column(name = "refund_transaction_ref", length = 120)
    private String refundTransactionRef;

    @Column(name = "admin_comment", length = 1000)
    private String adminComment;

    @Column(name = "processed_by", length = 120)
    private String processedBy;

    @Column(name = "requested_at", nullable = false, updatable = false)
    private Instant requestedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "refund_completed_at")
    private Instant refundCompletedAt;

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) this.requestedAt = Instant.now();
    }
}
