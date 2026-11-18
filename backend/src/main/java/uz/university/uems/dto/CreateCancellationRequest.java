package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Booking cancellation request payload")
public class CreateCancellationRequest {

    @Schema(description = "Cancellation reason (5-1000 chars)", example = "Event postponed due to university exam schedule.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Cancellation reason is required")
    @Size(min = 5, max = 1000, message = "Reason must be between 5 and 1000 characters")
    private String reason;
}
