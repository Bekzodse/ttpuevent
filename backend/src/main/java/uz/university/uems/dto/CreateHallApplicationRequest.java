package uz.university.uems.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class CreateHallApplicationRequest {

    @NotBlank(message = "Event name is required")
    @Size(min = 3, max = 160, message = "Event name must be between 3 and 160 characters")
    private String eventName;

    @NotBlank(message = "Event type is required")
    @Size(max = 60, message = "Event type must not exceed 60 characters")
    private String eventType;

    @NotNull(message = "Please select an event hall")
    private Long hallId;

    @NotNull(message = "Event date is required")
    @FutureOrPresent(message = "Event date cannot be in the past")
    private LocalDate eventDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Expected number of participants is required")
    @Min(value = 1, message = "Expected participants must be at least 1")
    @Max(value = 10000, message = "Expected participants is unrealistic")
    private Integer expectedParticipants;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @Valid
    private List<EquipmentItemRequest> equipmentItems;
}
