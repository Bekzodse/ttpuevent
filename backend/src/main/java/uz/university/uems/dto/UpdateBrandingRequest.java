package uz.university.uems.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBrandingRequest {

    @NotBlank(message = "University name is required")
    @Size(min = 2, max = 160)
    private String universityName;

    @NotBlank(message = "University subtitle is required")
    @Size(max = 200)
    private String universitySubtitle;

    @NotBlank(message = "Login headline is required")
    @Size(max = 200)
    private String loginHeadline;

    @NotBlank(message = "Login description is required")
    @Size(max = 600)
    private String loginDescription;

    @NotBlank(message = "Primary color is required")
    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Primary color must be a valid 6-digit hex code (e.g. #4f46e5)")
    private String primaryColor;

    @NotBlank(message = "Secondary color is required")
    @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "Secondary color must be a valid 6-digit hex code (e.g. #7c3aed)")
    private String secondaryColor;

    @Size(max = 120)
    private String contactEmail;

    @Size(max = 40)
    private String contactPhone;

    @Size(max = 250)
    private String contactAddress;

    @Size(max = 200)
    private String websiteUrl;
}
