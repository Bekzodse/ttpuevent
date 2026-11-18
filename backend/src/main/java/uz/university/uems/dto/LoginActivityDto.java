package uz.university.uems.dto;

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
public class LoginActivityDto {
    private Long id;
    private Long userId;
    private String username;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String profilePictureUrl;
    private Role role;
    private Instant loginTime;
    private String ipAddress;
    private String userAgent;
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
