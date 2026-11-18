package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Student details collected when registering for a campus event")
public class EventRegistrationRequest {

    @Schema(description = "Participant full name (2-160 chars)", example = "Malika Yusupova", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 160, message = "Full name must be between 2 and 160 characters")
    private String fullName;

    @Schema(description = "Contact phone number (7-20 digits)", example = "+998901234567", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Phone number is required")
    @Pattern(
        regexp = "^\\+?[0-9\\s\\-()]{7,20}$",
        message = "Phone number must contain 7 to 20 digits (e.g. +998901234567)"
    )
    private String phoneNumber;

    @Schema(description = "Contact email address", example = "malika.yusupova@turin.uz")
    @Email(message = "Please enter a valid email address")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    private String email;

    @Schema(description = "Faculty, department, or study program", example = "Computer Science")
    @Size(max = 120, message = "Department must not exceed 120 characters")
    private String department;

    @Schema(description = "Optional Student ID or academic group", example = "U221045 / SE-21")
    @Size(max = 60, message = "Student ID / group must not exceed 60 characters")
    private String studentCode;

    @Schema(description = "Optional participant notes or questions", example = "Joining with 1 friend")
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
