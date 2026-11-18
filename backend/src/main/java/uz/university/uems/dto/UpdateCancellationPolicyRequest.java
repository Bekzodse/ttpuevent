package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Admin cancellation & refund policy update request")
public class UpdateCancellationPolicyRequest {

    @Schema(description = "Policy name", example = "Standard University Cancellation Policy", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Policy name is required")
    @Size(max = 120)
    private String name;

    @Schema(description = "Hours before event for 100% refund (1-720)", example = "48", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull
    @Min(value = 1, message = "Full refund hours must be at least 1")
    @Max(value = 720)
    private Integer fullRefundHoursBefore;

    @Schema(description = "Hours before event for partial refund (0-720)", example = "24", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull
    @Min(value = 0, message = "Partial refund hours cannot be negative")
    @Max(value = 720)
    private Integer partialRefundHoursBefore;

    @Schema(description = "Partial refund percentage (0-100)", example = "50", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull
    @Min(value = 0)
    @Max(value = 100)
    private Integer partialRefundPercent;

    @Schema(description = "Automatically release hall slot when cancellation is approved", example = "true")
    private boolean releaseHallOnApproval = true;

    @Schema(description = "Human-readable policy summary", example = "100% refund 48h+ before event; 50% between 24-48h.")
    @Size(max = 500)
    private String description;
}
