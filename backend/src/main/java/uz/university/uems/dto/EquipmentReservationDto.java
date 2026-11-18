package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.EquipmentRequestStatus;
import uz.university.uems.entity.EquipmentReservation;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Equipment reservation attached to a hall booking application")
public class EquipmentReservationDto {
    private Long id;
    private Long equipmentId;
    private String equipmentName;
    private String category;
    private Integer quantityRequested;
    private BigDecimal unitFee;
    private EquipmentRequestStatus status;
    private String adminComment;

    public static EquipmentReservationDto from(EquipmentReservation r) {
        return EquipmentReservationDto.builder()
                .id(r.getId())
                .equipmentId(r.getEquipment().getId())
                .equipmentName(r.getEquipment().getName())
                .category(r.getEquipment().getCategory())
                .quantityRequested(r.getQuantityRequested())
                .unitFee(r.getEquipment().getUnitFee())
                .status(r.getStatus())
                .adminComment(r.getAdminComment())
                .build();
    }
}
