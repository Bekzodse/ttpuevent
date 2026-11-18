package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Applicant reply to an administrator information request")
public class UserInfoReplyRequest {

    @Schema(description = "Reply message (3-1500 chars)", example = "Attached full speaker schedule and security plan.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Additional information message is required")
    @Size(min = 3, max = 1500, message = "Message must be between 3 and 1500 characters")
    private String reply;
}
