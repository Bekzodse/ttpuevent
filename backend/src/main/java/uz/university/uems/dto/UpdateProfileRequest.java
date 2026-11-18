package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Self-service user profile update request")
public class UpdateProfileRequest {

    @Schema(description = "First name", example = "Malika", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 80, message = "First name must be between 2 and 80 characters")
    private String firstName;

    @Schema(description = "Last name", example = "Yusupova", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Last name is required")
    @Size(min = 2, max = 80, message = "Last name must be between 2 and 80 characters")
    private String lastName;

    @Schema(description = "Phone number", example = "+998901234567", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9\\s\\-()]{7,20}$",
        message = "Phone number must contain 7 to 20 digits (e.g. +998901234567)"
    )
    private String phoneNumber;

    @Schema(description = "Academic department", example = "Computer Science")
    @Size(max = 120, message = "Department must not exceed 120 characters")
    private String department;

    @Schema(description = "Short bio", example = "Organizer of campus AI hackathons")
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Schema(description = "Contact email", example = "malika.yusupova@turin.uz")
    @Email(message = "Please enter a valid email address")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    private String email;
}
