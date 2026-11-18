package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.UniversityEvent;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Campus event details")
public class EventDto {
    @Schema(description = "Event ID", example = "1")
    private Long id;
    @Schema(description = "Event title", example = "International Students' Day 2026")
    private String title;
    @Schema(description = "Event description")
    private String description;
    @Schema(description = "Event category", example = "Cultural")
    private String category;
    @Schema(description = "Event date", example = "2026-11-17")
    private LocalDate date;
    @Schema(description = "Event start time", example = "16:00")
    private String time;
    @Schema(description = "Location / venue", example = "The Annual Conference Hall")
    private String location;
    @Schema(description = "Organizer", example = "Students' Union")
    private String organizer;
    @Schema(description = "Maximum capacity", example = "250")
    private Integer capacity;
    @Schema(description = "Current registered participant count", example = "42")
    private Integer registered;
    @Schema(description = "Fallback Tailwind gradient class", example = "from-sky-500 to-blue-600")
    private String gradient;
    @Schema(description = "Lifecycle status (Upcoming, Completed, Cancelled, Draft)", example = "Upcoming")
    private String status;
    @Schema(description = "Cover image URL", example = "/events/students-day-2026.jpg", nullable = true)
    private String imageUrl;
    @Schema(description = "Whether event is publicly visible", example = "true")
    private boolean published;
    @Schema(description = "Creation timestamp (UTC)")
    private Instant createdAt;
    @Schema(description = "Whether the current authenticated user is registered", example = "false")
    private boolean userRegistered;

    public static EventDto from(UniversityEvent event, boolean userRegistered) {
        return EventDto.builder()
                .id(event.getId())
                .title(event.getTitle())
                .description(event.getDescription())
                .category(event.getCategory())
                .date(event.getEventDate())
                .time(event.getEventTime())
                .location(event.getLocation())
                .organizer(event.getOrganizer())
                .capacity(event.getCapacity())
                .registered(event.getRegisteredCount())
                .gradient(event.getGradient())
                .status(event.getStatus())
                .imageUrl(event.getImageUrl())
                .published(event.isPublished())
                .createdAt(event.getCreatedAt())
                .userRegistered(userRegistered)
                .build();
    }
}
