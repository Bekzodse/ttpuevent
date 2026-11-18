package uz.university.uems.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Lifecycle status of a hall booking application: PENDING, UNDER_REVIEW, APPROVED, REJECTED, PAYMENT_PENDING (24h hold), PAYMENT_UNDER_REVIEW, PAYMENT_APPROVED, PAYMENT_REJECTED, CONFIRMED, CANCELLED, EXPIRED")
public enum BookingStatus {
    PENDING,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    PAYMENT_PENDING,
    PAYMENT_UNDER_REVIEW,
    PAYMENT_APPROVED,
    PAYMENT_REJECTED,
    CONFIRMED,
    CANCELLED,
    EXPIRED
}
