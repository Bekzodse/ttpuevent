package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
@Schema(description = "Update campus event request payload")
public class UpdateEventRequest {

    @Schema(description = "Event title (3-150 chars)", example = "AI Research Seminar 2026 (Updated)", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @Schema(description = "Event description (10-2000 chars)", example = "Updated agenda and speaker lineup.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @Schema(description = "Event category", example = "Technology", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Category is required")
    private String category;

    @Schema(description = "Event date (YYYY-MM-DD)", example = "2026-12-10", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Event date is required")
    private LocalDate date;

    @Schema(description = "Event time (HH:mm)", example = "15:00", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Event time is required")
    private String time;

    @Schema(description = "Event location", example = "Green Hall", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    @Schema(description = "Event organizer", example = "CS Department", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Organizer is required")
    @Size(max = 150, message = "Organizer must not exceed 150 characters")
    private String organizer;

    @Schema(description = "Capacity (must be >= current registered count)", example = "180", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @Schema(description = "Cover image URL", example = "/events/students-day-2026.jpg")
    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @Schema(description = "Event status (Upcoming, Completed, Cancelled, Draft)", example = "Upcoming")
    private String status;

    @Schema(description = "Public visibility flag", example = "true")
    private Boolean published;
}
