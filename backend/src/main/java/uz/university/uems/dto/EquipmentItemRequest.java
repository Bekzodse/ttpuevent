package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Requested equipment quantity item within a hall booking application")
public class EquipmentItemRequest {

    @Schema(description = "Equipment ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Equipment ID is required")
    private Long equipmentId;

    @Schema(description = "Requested quantity (>= 1)", example = "2", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
