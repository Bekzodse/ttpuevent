package uz.university.uems.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminDecisionRequest {

    @NotBlank(message = "Reason or comment is required")
    @Size(min = 3, max = 1000, message = "Comment must be between 3 and 1000 characters")
    private String comment;
}
