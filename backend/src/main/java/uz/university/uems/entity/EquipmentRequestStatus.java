package uz.university.uems.entity;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Equipment reservation request status: PENDING, APPROVED, REJECTED, or RELEASED (stock returned)")
public enum EquipmentRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    RELEASED
}
