package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.ApplicationHistory;
import uz.university.uems.entity.BookingStatus;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Audit trail entry for a hall booking application")
public class ApplicationHistoryDto {
    private Long id;
    private String actorUsername;
    private String actorFullName;
    private String actorRole;
    private String action;
    private BookingStatus previousStatus;
    private BookingStatus newStatus;
    private String comment;
    private Instant createdAt;

    public static ApplicationHistoryDto from(ApplicationHistory h) {
        return ApplicationHistoryDto.builder()
                .id(h.getId())
                .actorUsername(h.getActorUsername())
                .actorFullName(h.getActorFullName())
                .actorRole(h.getActorRole())
                .action(h.getAction())
                .previousStatus(h.getPreviousStatus())
                .newStatus(h.getNewStatus())
                .comment(h.getComment())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
