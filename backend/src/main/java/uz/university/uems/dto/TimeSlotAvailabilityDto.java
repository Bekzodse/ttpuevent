package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeSlotAvailabilityDto {
    private LocalTime startTime;
    private LocalTime endTime;
    private String slotState; // AVAILABLE, RESERVED, CONFIRMED, PENDING, BLOCKED
    private String eventName;
    private String bookingCode;
}
