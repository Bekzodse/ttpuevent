package uz.university.uems.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CreateScheduleBlockRequest {

    @NotNull(message = "Event hall is required")
    private Long hallId;

    @NotNull(message = "Date is required")
    @FutureOrPresent(message = "Schedule block date cannot be in the past")
    private LocalDate blockDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Block type is required")
    private String blockType;

    @NotBlank(message = "Reason is required")
    @Size(min = 3, max = 500, message = "Reason must be between 3 and 500 characters")
    private String reason;
}
