package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.EventHall;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "University event hall metadata and pricing")
public class EventHallDto {
    private Long id;
    private String name;
    private String building;
    private String floor;
    private Integer capacity;
    private BigDecimal hourlyRate;
    private String amenities;
    private String description;
    private String imageUrl;
    private boolean active;

    public static EventHallDto from(EventHall hall) {
        return EventHallDto.builder()
                .id(hall.getId())
                .name(hall.getName())
                .building(hall.getBuilding())
                .floor(hall.getFloor())
                .capacity(hall.getCapacity())
                .hourlyRate(hall.getHourlyRate())
                .amenities(hall.getAmenities())
                .description(hall.getDescription())
                .imageUrl(hall.getImageUrl())
                .active(hall.isActive())
                .build();
    }
}
