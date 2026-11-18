package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Schema(description = "Create or update equipment item request")
public class EquipmentRequestDto {

    @Schema(description = "Unique equipment name (2-120 chars)", example = "4K Laser Projector", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Equipment name is required")
    @Size(min = 2, max = 120, message = "Equipment name must be between 2 and 120 characters")
    private String name;

    @Schema(description = "Equipment category", example = "Visual", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Category is required")
    @Size(max = 60)
    private String category;

    @Schema(description = "Optional description", example = "High-lumen 4K laser projector")
    @Size(max = 500)
    private String description;

    @Schema(description = "Total inventory count (0-10000)", example = "6", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Total quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    @Max(value = 10000)
    private Integer totalQuantity;

    @Schema(description = "Rental fee per unit (>= 0.00)", example = "10.00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Unit fee is required")
    @DecimalMin(value = "0.00", message = "Unit fee cannot be negative")
    private BigDecimal unitFee;

    @Schema(description = "Whether equipment is available for booking", example = "true")
    private boolean active = true;
}
