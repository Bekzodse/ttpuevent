package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "New student/organizer registration payload")
public class RegisterRequest {

    @Schema(description = "First name (2-80 chars)", example = "Malika", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 80, message = "First name must be between 2 and 80 characters")
    private String firstName;

    @Schema(description = "Last name (2-80 chars)", example = "Yusupova", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 80, message = "Last name must be between 2 and 80 characters")
    private String lastName;

    @Schema(description = "Phone number with 7-20 digits", example = "+998901234567", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9\\s\\-()]{7,20}$",
        message = "Phone number must contain 7 to 20 digits (e.g. +998901234567)"
    )
    private String phoneNumber;

    @Schema(description = "Unique username (3-50 chars, letters/digits/._-)", example = "malika_cs", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(
        regexp = "^[a-zA-Z0-9._-]+$",
        message = "Username can only contain letters, numbers, dots, underscores, and hyphens"
    )
    private String username;

    @Schema(description = "Account password (min 6 chars)", example = "Secret123!", requiredMode = Schema.RequiredMode.REQUIRED, format = "password")
    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be at least 6 characters")
    private String password;

    @Schema(description = "Faculty or academic department", example = "Computer Science", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Size(max = 120, message = "Department must not exceed 120 characters")
    private String department;

    @Schema(description = "Optional contact email address", example = "malika.yusupova@turin.uz", requiredMode = Schema.RequiredMode.NOT_REQUIRED)
    @Email(message = "Please enter a valid email address")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    private String email;
}
