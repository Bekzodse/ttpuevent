package uz.university.uems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.ErrorResponse;
import uz.university.uems.dto.UniversityBrandingDto;
import uz.university.uems.dto.UpdateBrandingRequest;
import uz.university.uems.service.BrandingService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Branding & System")
public class BrandingController {

    private final BrandingService brandingService;

    @Operation(summary = "Get active university branding", description = "Public endpoint returning portal name, colors, logo URL, and contact details.")
    @ApiResponse(responseCode = "200", description = "Branding settings returned",
            content = @Content(schema = @Schema(implementation = UniversityBrandingDto.class)))
    @GetMapping("/branding")
    public ResponseEntity<UniversityBrandingDto> getBranding() {
        return ResponseEntity.ok(brandingService.getBranding());
    }

    @Operation(
            summary = "Update university branding (ADMIN)",
            description = "Requires ADMIN role. Updates portal name, colors, login headlines, and contact info.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Branding updated",
                    content = @Content(schema = @Schema(implementation = UniversityBrandingDto.class))),
            @ApiResponse(responseCode = "400", description = "Validation error",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "403", description = "ADMIN role required",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/admin/branding")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityBrandingDto> updateBranding(
            @Valid @RequestBody UpdateBrandingRequest request) {
        return ResponseEntity.ok(brandingService.updateBranding(request));
    }

    @Operation(
            summary = "Upload university logo (ADMIN)",
            description = "Requires ADMIN role. Accepts PNG, JPG, WEBP, or GIF up to 5 MB.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Logo uploaded",
                    content = @Content(schema = @Schema(implementation = UniversityBrandingDto.class))),
            @ApiResponse(responseCode = "403", description = "ADMIN role required",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping(value = "/admin/branding/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityBrandingDto> uploadLogo(
            @Parameter(description = "Logo image file", required = true) @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(brandingService.uploadLogo(file));
    }

    @Operation(
            summary = "Remove university logo (ADMIN)",
            description = "Requires ADMIN role.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Logo removed",
            content = @Content(schema = @Schema(implementation = UniversityBrandingDto.class)))
    @DeleteMapping("/admin/branding/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityBrandingDto> deleteLogo() {
        return ResponseEntity.ok(brandingService.deleteLogo());
    }
}
