package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
@Schema(description = "Create campus event request payload")
public class CreateEventRequest {

    @Schema(description = "Event title (3-150 chars)", example = "AI Research Seminar 2026", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @Schema(description = "Full event description (10-2000 chars)", example = "Keynote talks on machine learning and robotics.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @Schema(description = "Event category", example = "Technology", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Category is required")
    private String category;

    @Schema(description = "Event date (YYYY-MM-DD)", example = "2026-12-10", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event date is required")
    private LocalDate date;

    @Schema(description = "Start time (HH:mm)", example = "14:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Event time is required")
    private String time;

    @Schema(description = "Venue or campus location", example = "The Annual Conference Hall", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    @Schema(description = "Organizing department or club", example = "Department of Computer Science", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Organizer is required")
    @Size(max = 150, message = "Organizer must not exceed 150 characters")
    private String organizer;

    @Schema(description = "Maximum participant capacity (>= 1)", example = "150", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @Schema(description = "Optional cover image URL or static path", example = "/events/students-day-2026.jpg")
    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @Schema(description = "Optional initial status (Upcoming, Completed, Cancelled, Draft)", example = "Upcoming")
    private String status;

    @Schema(description = "Whether the event is publicly visible (defaults to true)", example = "true")
    private Boolean published;
}
