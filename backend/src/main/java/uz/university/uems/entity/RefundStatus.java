package uz.university.uems.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Refund processing status: NOT_APPLICABLE, PENDING_VERIFICATION, APPROVED, COMPLETED, or REJECTED")
public enum RefundStatus {
    NOT_APPLICABLE,
    PENDING_VERIFICATION,
    APPROVED,
    COMPLETED,
    REJECTED
}
