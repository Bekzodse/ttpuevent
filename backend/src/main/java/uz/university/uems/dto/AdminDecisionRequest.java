package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Required comment/reason payload for rejection or info request")
public class AdminDecisionRequest {

    @Schema(description = "Reason or message (3-1000 chars)", example = "Please provide speaker list and agenda.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Reason or comment is required")
    @Size(min = 3, max = 1000, message = "Comment must be between 3 and 1000 characters")
    private String comment;
}
