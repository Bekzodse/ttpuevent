package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;

import java.time.Duration;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User account profile details")
public class UserDto {
    @Schema(description = "Unique user ID", example = "2")
    private Long id;
    @Schema(description = "First name", example = "Malika")
    private String firstName;
    @Schema(description = "Last name", example = "Yusupova")
    private String lastName;
    @Schema(description = "Normalized phone number", example = "+998901234567")
    private String phoneNumber;
    @Schema(description = "Unique username", example = "malika")
    private String username;
    @Schema(description = "Email address (optional)", example = "malika.yusupova@turin.uz")
    private String email;
    @Schema(description = "Assigned role", example = "USER")
    private Role role;
    @Schema(description = "Relative URL of uploaded profile picture", example = "/api/files/avatars/avatar.png", nullable = true)
    private String profilePictureUrl;
    @Schema(description = "Department or faculty", example = "Computer Science", nullable = true)
    private String department;
    @Schema(description = "Short user biography", example = "3rd-year CS student", nullable = true)
    private String bio;
    @Schema(description = "Whether account is enabled", example = "true")
    private boolean active;
    @Schema(description = "True if user had activity within the last 15 minutes", example = "true")
    private boolean currentlyOnline;
    @Schema(description = "Account creation timestamp (UTC)")
    private Instant createdAt;
    @Schema(description = "Last update timestamp (UTC)")
    private Instant updatedAt;
    @Schema(description = "Most recent login timestamp (UTC)", nullable = true)
    private Instant lastLoginAt;
    @Schema(description = "Most recent API activity timestamp (UTC)", nullable = true)
    private Instant lastActivityAt;

    public static UserDto from(User user) {
        boolean online = user.isActive()
                && user.getLastActivityAt() != null
                && Duration.between(user.getLastActivityAt(), Instant.now()).toMinutes() < 15;

        String avatarUrl = user.getProfilePicture() != null && !user.getProfilePicture().isBlank()
                ? "/api/files/avatars/" + user.getProfilePicture()
                : null;

        return UserDto.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .profilePictureUrl(avatarUrl)
                .department(user.getDepartment())
                .bio(user.getBio())
                .active(user.isActive())
                .currentlyOnline(online)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .lastActivityAt(user.getLastActivityAt())
                .build();
    }
}
