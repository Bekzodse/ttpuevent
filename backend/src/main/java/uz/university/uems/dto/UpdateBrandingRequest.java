package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Admin university branding and theme update payload")
public class UpdateBrandingRequest {

    @Schema(description = "University name", example = "Turin Polytechnic University in Tashkent", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "University name is required")
    @Size(min = 2, max = 160)
    private String universityName;

    @Schema(description = "Portal subtitle", example = "Students' Union · Event & Hall Portal", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "University subtitle is required")
    @Size(max = 200)
    private String universitySubtitle;

    @Schema(description = "Login page headline", example = "Welcome to Turin Polytechnic University in Tashkent", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Login headline is required")
    @Size(max = 200)
    private String loginHeadline;

    @Schema(description = "Login page description", example = "Sign in to book event halls and manage events.", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Login description is required")
    @Size(max = 600)
    private String loginDescription;

    @Schema(description = "Primary brand hex color (#RRGGBB)", example = "#1d3b8b", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Primary color is required")
    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Primary color must be a valid 6-digit hex code (e.g. #4f46e5)")
    private String primaryColor;

    @Schema(description = "Secondary brand hex color (#RRGGBB)", example = "#3668b2", requiredMode = Schema.RequiredMode.REQUIRED)
    @NotBlank(message = "Secondary color is required")
    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Secondary color must be a valid 6-digit hex code (e.g. #7c3aed)")
    private String secondaryColor;

    @Schema(description = "Contact email", example = "info@polito.uz")
    @Size(max = 120)
    private String contactEmail;

    @Schema(description = "Contact phone", example = "+998 71 246-80-51")
    @Size(max = 40)
    private String contactPhone;

    @Schema(description = "Campus address", example = "17 Little Ring Road, Tashkent")
    @Size(max = 250)
    private String contactAddress;

    @Schema(description = "Official website URL", example = "https://turin.uz")
    @Size(max = 200)
    private String websiteUrl;
}
