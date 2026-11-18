package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.HallScheduleBlock;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Administrator-defined hall schedule block")
public class HallScheduleBlockDto {
    private Long id;
    private Long hallId;
    private String hallName;
    private LocalDate blockDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String blockType;
    private String reason;
    private String createdBy;
    private Instant createdAt;

    public static HallScheduleBlockDto from(HallScheduleBlock b) {
        return HallScheduleBlockDto.builder()
                .id(b.getId())
                .hallId(b.getHall().getId())
                .hallName(b.getHall().getName())
                .blockDate(b.getBlockDate())
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .blockType(b.getBlockType())
                .reason(b.getReason())
                .createdBy(b.getCreatedBy())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
