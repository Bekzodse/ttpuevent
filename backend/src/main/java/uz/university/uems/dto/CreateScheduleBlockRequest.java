package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Schema(description = "Admin hall schedule block creation payload")
public class CreateScheduleBlockRequest {

    @Schema(description = "Target hall ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event hall is required")
    private Long hallId;

    @Schema(description = "Date to block (today or future)", example = "2026-12-20", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Date is required")
    @FutureOrPresent(message = "Schedule block date cannot be in the past")
    private LocalDate blockDate;

    @Schema(description = "Block start time (HH:mm:ss)", example = "08:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @Schema(description = "Block end time (HH:mm:ss)", example = "12:00:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @Schema(description = "Block type (MAINTENANCE, UNIVERSITY_RESERVED, CLOSED)", example = "MAINTENANCE", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Block type is required")
    private String blockType;

    @Schema(description = "Reason for blocking (3-500 chars)", example = "Audio system calibration", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Reason is required")
    @Size(min = 3, max = 500, message = "Reason must be between 3 and 500 characters")
    private String reason;
}
