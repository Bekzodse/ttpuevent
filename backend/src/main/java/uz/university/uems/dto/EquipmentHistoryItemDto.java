package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.EquipmentRequestStatus;
import uz.university.uems.entity.EquipmentReservation;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Historical equipment reservation usage entry")
public class EquipmentHistoryItemDto {
    private Long id;
    private Long applicationId;
    private String applicationCode;
    private String eventName;
    private String hallName;
    private String applicantName;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer quantityRequested;
    private EquipmentRequestStatus status;
    private BookingStatus bookingStatus;
    private Instant createdAt;

    public static EquipmentHistoryItemDto from(EquipmentReservation r) {
        var app = r.getApplication();
        return EquipmentHistoryItemDto.builder()
                .id(r.getId())
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .eventName(app.getEventName())
                .hallName(app.getHall().getName())
                .applicantName(app.getApplicantFirstName() + " " + app.getApplicantLastName())
                .eventDate(app.getEventDate())
                .startTime(app.getStartTime())
                .endTime(app.getEndTime())
                .quantityRequested(r.getQuantityRequested())
                .status(r.getStatus())
                .bookingStatus(app.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
