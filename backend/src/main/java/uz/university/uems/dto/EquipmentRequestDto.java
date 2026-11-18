package uz.university.uems.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EquipmentRequestDto {

    @NotBlank(message = "Equipment name is required")
    @Size(min = 2, max = 120, message = "Equipment name must be between 2 and 120 characters")
    private String name;

    @NotBlank(message = "Category is required")
    @Size(max = 60)
    private String category;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Total quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    @Max(value = 10000)
    private Integer totalQuantity;

    @NotNull(message = "Unit fee is required")
    @DecimalMin(value = "0.00", message = "Unit fee cannot be negative")
    private BigDecimal unitFee;

    private boolean active = true;
}
