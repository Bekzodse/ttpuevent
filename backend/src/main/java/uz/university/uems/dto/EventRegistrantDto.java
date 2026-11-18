package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.EventRegistration;
import uz.university.uems.entity.User;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Registered participant summary for a campus event")
public class EventRegistrantDto {
    @Schema(description = "Registration record ID", example = "15")
    private Long registrationId;
    @Schema(description = "User ID", example = "2")
    private Long userId;
    @Schema(description = "Username", example = "malika")
    private String username;
    @Schema(description = "First name", example = "Malika")
    private String firstName;
    @Schema(description = "Last name", example = "Yusupova")
    private String lastName;
    @Schema(description = "Email address", example = "malika.yusupova@turin.uz", nullable = true)
    private String email;
    @Schema(description = "Phone number", example = "+998901234567")
    private String phoneNumber;
    @Schema(description = "Department", example = "Computer Science", nullable = true)
    private String department;
    @Schema(description = "Registration timestamp (UTC)")
    private Instant registeredAt;

    public static EventRegistrantDto from(EventRegistration reg) {
        User u = reg.getUser();
        return EventRegistrantDto.builder()
                .registrationId(reg.getId())
                .userId(u.getId())
                .username(u.getUsername())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .department(u.getDepartment())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }
}
