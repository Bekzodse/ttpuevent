package uz.university.uems.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateEventRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 150, message = "Title must be between 3 and 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Event date is required")
    private LocalDate date;

    @NotBlank(message = "Event time is required")
    private String time;

    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    @NotBlank(message = "Organizer is required")
    @Size(max = 150, message = "Organizer must not exceed 150 characters")
    private String organizer;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
}
