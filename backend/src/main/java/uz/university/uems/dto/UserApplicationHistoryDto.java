package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Combined hall booking applications and campus event registrations for a user")
public class UserApplicationHistoryDto {

    private UserDto user;
    private List<HallApplicationDto> hallApplications;
    private List<EventRegistrationItem> eventRegistrations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EventRegistrationItem {
        private Long registrationId;
        private EventDto event;
        private Instant registeredAt;
    }
}
