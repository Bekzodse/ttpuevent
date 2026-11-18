package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Schema(description = "Hall booking application submission payload")
public class CreateHallApplicationRequest {

    @Schema(description = "Event title (3-160 chars)", example = "Tech Innovation Forum", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Event name is required")
    @Size(min = 3, max = 160, message = "Event name must be between 3 and 160 characters")
    private String eventName;

    @Schema(description = "Event category/type", example = "Conference", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Event type is required")
    @Size(max = 60, message = "Event type must not exceed 60 characters")
    private String eventType;

    @Schema(description = "Target Event Hall ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Please select an event hall")
    private Long hallId;

    @Schema(description = "Event date (today or future)", example = "2026-12-15", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date cannot be in the past")
    private LocalDate eventDate;

    @Schema(description = "Start time (HH:mm:ss)", example = "10:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @Schema(description = "End time (HH:mm:ss, at least 30 min after start)", example = "13:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @Schema(description = "Expected attendees (1-10000, must fit hall capacity)", example = "120", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Expected number of participants is required")
    @Min(value = 1, message = "Expected participants must be at least 1")
    @Max(value = 10000, message = "Expected participants is unrealistic")
    private Integer expectedParticipants;

    @Schema(description = "Optional event description or notes", example = "Annual engineering student summit")
    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @Schema(description = "Optional equipment reservation requests")
    @Valid
    private List<EquipmentItemRequest> equipmentItems;
}
