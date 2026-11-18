package uz.university.uems.dto;

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
public class UserDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String username;
    private Role role;
    private String profilePictureUrl;
    private String department;
    private String bio;
    private boolean active;
    private boolean currentlyOnline;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
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
