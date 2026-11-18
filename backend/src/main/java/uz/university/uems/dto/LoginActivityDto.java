package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.LoginActivity;
import uz.university.uems.entity.Role;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "User authentication audit entry")
public class LoginActivityDto {
    @Schema(description = "Log entry ID", example = "12")
    private Long id;
    @Schema(description = "User ID", example = "2")
    private Long userId;
    @Schema(description = "Username", example = "malika")
    private String username;
    @Schema(description = "First name", example = "Malika")
    private String firstName;
    @Schema(description = "Last name", example = "Yusupova")
    private String lastName;
    @Schema(description = "Phone number", example = "+998901234567")
    private String phoneNumber;
    @Schema(description = "Avatar URL", nullable = true)
    private String profilePictureUrl;
    @Schema(description = "User role", example = "USER")
    private Role role;
    @Schema(description = "Login attempt timestamp (UTC)")
    private Instant loginTime;
    @Schema(description = "Client IP address", example = "127.0.0.1")
    private String ipAddress;
    @Schema(description = "Client User-Agent string", nullable = true)
    private String userAgent;
    @Schema(description = "Whether authentication succeeded", example = "true")
    private boolean successful;

    public static LoginActivityDto from(LoginActivity activity) {
        var user = activity.getUser();
        String avatarUrl = user.getProfilePicture() != null && !user.getProfilePicture().isBlank()
                ? "/api/files/avatars/" + user.getProfilePicture()
                : null;
        return LoginActivityDto.builder()
                .id(activity.getId())
                .userId(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .profilePictureUrl(avatarUrl)
                .role(user.getRole())
                .loginTime(activity.getLoginTime())
                .ipAddress(activity.getIpAddress())
                .userAgent(activity.getUserAgent())
                .successful(activity.isSuccessful())
                .build();
    }
}
