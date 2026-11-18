package uz.university.uems.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import uz.university.uems.entity.Role;

@Data
public class AdminUpdateUserRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 80, message = "First name must be between 2 and 80 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 80, message = "Last name must be between 2 and 80 characters")
    private String lastName;

    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9\\s\\-()]{7,20}$",
        message = "Phone number must contain 7 to 20 digits"
    )
    private String phoneNumber;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(
        regexp = "^[a-zA-Z0-9._-]+$",
        message = "Username can only contain letters, numbers, dots, underscores, and hyphens"
    )
    private String username;

    @NotNull(message = "Role is required")
    private Role role;

    private boolean active;

    @Size(max = 120, message = "Department must not exceed 120 characters")
    private String department;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;
}
