package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Hourly time-slot availability status for a hall on a specific date")
public class TimeSlotAvailabilityDto {
    private LocalTime startTime;
    private LocalTime endTime;
    private String slotState; // AVAILABLE, RESERVED, CONFIRMED, PENDING, BLOCKED
    private String eventName;
    private String bookingCode;
}
