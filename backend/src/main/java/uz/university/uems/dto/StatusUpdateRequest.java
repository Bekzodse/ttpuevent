package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Boolean status update payload (activate/deactivate)")
public class StatusUpdateRequest {
    @Schema(description = "Target active state", example = "true", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Active status is required")
    private Boolean active;
}
