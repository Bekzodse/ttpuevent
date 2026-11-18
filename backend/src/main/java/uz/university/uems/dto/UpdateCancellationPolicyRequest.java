package uz.university.uems.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCancellationPolicyRequest {

    @NotBlank(message = "Policy name is required")
    @Size(max = 120)
    private String name;

    @NotNull
    @Min(value = 1, message = "Full refund hours must be at least 1")
    @Max(value = 720)
    private Integer fullRefundHoursBefore;

    @NotNull
    @Min(value = 0, message = "Partial refund hours cannot be negative")
    @Max(value = 720)
    private Integer partialRefundHoursBefore;

    @NotNull
    @Min(value = 0)
    @Max(value = 100)
    private Integer partialRefundPercent;

    private boolean releaseHallOnApproval = true;

    @Size(max = 500)
    private String description;
}
