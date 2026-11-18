package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Optional admin comment payload")
public class AdminOptionalCommentRequest {
    @Schema(description = "Optional note (max 1000 chars)", example = "Approved. Complete payment within 24 hours.")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
}
