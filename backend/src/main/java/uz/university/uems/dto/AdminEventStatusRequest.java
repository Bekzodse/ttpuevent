package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Admin event status update payload")
public class AdminEventStatusRequest {
    @Schema(description = "Target event status (Upcoming, Completed, Cancelled, Draft)", example = "Cancelled", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Status is required")
    private String status;

    @Schema(description = "Optional public visibility override", example = "true")
    private Boolean published;
}
