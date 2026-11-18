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
    @Schema(description = "Submitted full name", example = "Malika Yusupova")
    private String fullName;
    @Schema(description = "First name", example = "Malika")
    private String firstName;
    @Schema(description = "Last name", example = "Yusupova")
    private String lastName;
    @Schema(description = "Email address", example = "malika.yusupova@turin.uz", nullable = true)
    private String email;
    @Schema(description = "Phone number", example = "+998901234567")
    private String phoneNumber;
    @Schema(description = "Department / faculty", example = "Computer Science", nullable = true)
    private String department;
    @Schema(description = "Optional Student ID / Group", example = "U221045", nullable = true)
    private String studentCode;
    @Schema(description = "Optional participant notes", nullable = true)
    private String notes;
    @Schema(description = "Registration timestamp (UTC)")
    private Instant registeredAt;

    public static EventRegistrantDto from(EventRegistration reg) {
        User u = reg.getUser();
        String resolvedFullName = reg.getFullName() != null && !reg.getFullName().isBlank()
                ? reg.getFullName()
                : (u.getFirstName() + " " + u.getLastName()).trim();
        return EventRegistrantDto.builder()
                .registrationId(reg.getId())
                .userId(u.getId())
                .username(u.getUsername())
                .fullName(resolvedFullName)
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .email(reg.getEmail() != null && !reg.getEmail().isBlank() ? reg.getEmail() : u.getEmail())
                .phoneNumber(reg.getPhoneNumber() != null && !reg.getPhoneNumber().isBlank() ? reg.getPhoneNumber() : u.getPhoneNumber())
                .department(reg.getDepartment() != null && !reg.getDepartment().isBlank() ? reg.getDepartment() : u.getDepartment())
                .studentCode(reg.getStudentCode())
                .notes(reg.getNotes())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }
}
