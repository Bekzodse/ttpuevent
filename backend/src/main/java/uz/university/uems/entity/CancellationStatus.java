package uz.university.uems.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Booking cancellation request status: PENDING, APPROVED, or REJECTED")
public enum CancellationStatus {
    PENDING,
    APPROVED,
    REJECTED
}
