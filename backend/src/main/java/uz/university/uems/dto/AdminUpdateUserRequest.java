package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import uz.university.uems.entity.Role;

@Data
@Schema(description = "Administrator user update request")
public class AdminUpdateUserRequest {

    @Schema(description = "First name", example = "Sardor", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 80, message = "First name must be between 2 and 80 characters")
    private String firstName;

    @Schema(description = "Last name", example = "Aliyev", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 80, message = "Last name must be between 2 and 80 characters")
    private String lastName;

    @Schema(description = "Phone number", example = "+998907776655", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9\\s\\-()]{7,20}$",
        message = "Phone number must contain 7 to 20 digits"
    )
    private String phoneNumber;

    @Schema(description = "Username", example = "sardor", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(
        regexp = "^[a-zA-Z0-9._-]+$",
        message = "Username can only contain letters, numbers, dots, underscores, and hyphens"
    )
    private String username;

    @Schema(description = "Assigned role (USER or ADMIN)", example = "USER", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Role is required")
    private Role role;

    @Schema(description = "Account active flag", example = "true")
    private boolean active;

    @Schema(description = "Faculty / department", example = "Software Engineering")
    @Size(max = 120, message = "Department must not exceed 120 characters")
    private String department;

    @Schema(description = "User bio", example = "Student council member")
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Schema(description = "Contact email", example = "sardor.aliyev@turin.uz")
    @Email(message = "Please enter a valid email address")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    private String email;
}
