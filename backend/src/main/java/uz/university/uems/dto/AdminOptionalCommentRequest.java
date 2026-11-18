package uz.university.uems.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminOptionalCommentRequest {
    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
}
