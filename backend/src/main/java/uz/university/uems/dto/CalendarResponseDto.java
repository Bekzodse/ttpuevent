package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Hall availability calendar containing halls, bookings, and admin schedule blocks")
public class CalendarResponseDto {
    private List<EventHallDto> halls;
    private List<CalendarEventDto> events;
    private List<HallScheduleBlockDto> blocks;
}
