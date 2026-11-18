package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.AdminActivityLog;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Administrative action audit log record")
public class AdminActivityLogDto {
    @Schema(description = "Activity log ID", example = "101")
    private Long id;
    @Schema(description = "Actor admin user ID", example = "1")
    private Long actorId;
    @Schema(description = "Actor username", example = "Bekzod")
    private String actorUsername;
    @Schema(description = "Actor full name", example = "Bekzod Admin")
    private String actorFullName;
    @Schema(description = "Action identifier", example = "EVENT_CREATED")
    private String actionType;
    @Schema(description = "Target entity category (EVENT, APPLICATION, USER)", example = "EVENT")
    private String targetType;
    @Schema(description = "Target entity ID", example = "7")
    private Long targetId;
    @Schema(description = "Human-readable target label", example = "Hiking to Sokok")
    private String targetLabel;
    @Schema(description = "Detailed description of the action", example = "Created event 'Hiking to Sokok'")
    private String details;
    @Schema(description = "Action timestamp (UTC)")
    private Instant createdAt;

    public static AdminActivityLogDto from(AdminActivityLog log) {
        return AdminActivityLogDto.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .actorUsername(log.getActorUsername())
                .actorFullName(log.getActorFullName())
                .actionType(log.getActionType())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .targetLabel(log.getTargetLabel())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
