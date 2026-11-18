package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.UniversityEvent;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDto {
    private Long id;
    private String title;
    private String description;
    private String category;
    private LocalDate date;
    private String time;
    private String location;
    private String organizer;
    private Integer capacity;
    private Integer registered;
    private String gradient;
    private String status;
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
                .userRegistered(userRegistered)
                .build();
    }
}
