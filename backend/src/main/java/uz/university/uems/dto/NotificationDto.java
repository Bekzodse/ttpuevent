package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.Notification;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String title;
    private String message;
    private String type;
    private Long applicationId;
    private String applicationCode;
    private BookingStatus bookingStatus;
    private boolean read;
    private Instant createdAt;

    public static NotificationDto from(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .applicationId(n.getApplicationId())
                .applicationCode(n.getApplicationCode())
                .bookingStatus(n.getBookingStatus())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
