package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Admin refund completion payload")
public class CompleteRefundRequest {

    @Schema(description = "Verified refunded amount (> 0.00)", example = "140.00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Refund amount is required")
    @DecimalMin(value = "0.01", message = "Refund amount must be greater than zero")
    private BigDecimal refundAmount;

    @Schema(description = "Bank transaction reference (3-120 chars)", example = "TXN-2026-88412", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Bank transaction reference is required")
    @Size(min = 3, max = 120, message = "Transaction reference must be between 3 and 120 characters")
    private String transactionRef;

    @Schema(description = "Optional admin note", example = "Refund transferred to applicant card.")
    @Size(max = 1000)
    private String adminComment;
}
