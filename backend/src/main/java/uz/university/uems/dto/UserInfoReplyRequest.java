package uz.university.uems.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserInfoReplyRequest {

    @NotBlank(message = "Additional information message is required")
    @Size(min = 3, max = 1500, message = "Message must be between 3 and 1500 characters")
    private String reply;
}
