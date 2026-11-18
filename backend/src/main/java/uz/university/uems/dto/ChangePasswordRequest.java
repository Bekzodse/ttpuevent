package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Password change request for authenticated user")
public class ChangePasswordRequest {

    @Schema(description = "Current password", example = "OldPass123!", requiredMode = Schema.RequiredMode.REQUIRED, format = "password")
    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @Schema(description = "New password (min 6 chars)", example = "NewPass456!", requiredMode = Schema.RequiredMode.REQUIRED, format = "password")
    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "New password must be at least 6 characters")
    private String newPassword;

    @Schema(description = "Confirmation matching newPassword", example = "NewPass456!", requiredMode = Schema.RequiredMode.REQUIRED, format = "password")
    @NotBlank(message = "Please confirm your new password")
    private String confirmPassword;
}
