package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.Equipment;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDto {
    private Long id;
    private String name;
    private String category;
    private String description;
    private Integer totalQuantity;
    private Integer availableQuantity;
    private Integer reservedQuantity;
    private BigDecimal unitFee;
    private boolean active;
    private Instant createdAt;

    public static EquipmentDto from(Equipment eq, long reservedQty) {
        int available = Math.max(0, eq.getTotalQuantity() - (int) reservedQty);
        return EquipmentDto.builder()
                .id(eq.getId())
                .name(eq.getName())
                .category(eq.getCategory())
                .description(eq.getDescription())
                .totalQuantity(eq.getTotalQuantity())
                .reservedQuantity((int) reservedQty)
                .availableQuantity(available)
                .unitFee(eq.getUnitFee())
                .active(eq.isActive())
                .createdAt(eq.getCreatedAt())
                .build();
    }
}
