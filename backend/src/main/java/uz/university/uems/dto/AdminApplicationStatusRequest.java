package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import uz.university.uems.entity.BookingStatus;

@Data
@Schema(description = "Admin direct application status update payload")
public class AdminApplicationStatusRequest {

    @Schema(description = "Target booking status (PENDING, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED, CONFIRMED)", example = "APPROVED", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotNull(message = "Target status is required")
    private BookingStatus status;

    @Schema(description = "Optional explanatory note for history and applicant notification", example = "Approved for main auditorium.")
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
}
