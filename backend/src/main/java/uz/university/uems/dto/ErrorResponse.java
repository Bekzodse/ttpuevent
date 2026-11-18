package uz.university.uems.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Standardized API error response")
public class ErrorResponse {
    @Schema(description = "UTC timestamp of the error")
    private Instant timestamp;
    @Schema(description = "HTTP status code", example = "400")
    private int status;
    @Schema(description = "HTTP error reason phrase", example = "Bad Request")
    private String error;
    @Schema(description = "Human-readable error description", example = "Validation failed")
    private String message;
    @Schema(description = "Request URI path", example = "/api/applications")
    private String path;
    @Schema(description = "Optional per-field validation errors", nullable = true)
    private Map<String, String> fieldErrors;
}
