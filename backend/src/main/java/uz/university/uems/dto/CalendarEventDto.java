package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.BookingStatus;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {
    private Long id;
    private String itemType; // BOOKING or SCHEDULE_BLOCK
    private String applicationCode;
    private Long hallId;
    private String hallName;
    private String eventName;
    private String eventType;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus bookingStatus;
    private String slotState; // AVAILABLE, RESERVED, CONFIRMED, PENDING, BLOCKED
    private String reason;
}
