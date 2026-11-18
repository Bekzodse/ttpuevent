package uz.university.uems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.university.uems.dto.ErrorResponse;
import uz.university.uems.entity.Role;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.FileStorageService;
import uz.university.uems.service.HallApplicationService;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "Files")
public class FileController {

    private final FileStorageService fileStorageService;
    private final HallApplicationService applicationService;

    @Operation(summary = "Download user avatar image", description = "Public endpoint serving uploaded profile avatars.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Image resource returned"),
            @ApiResponse(responseCode = "404", description = "Avatar not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/avatars/{filename:.+}")
    public ResponseEntity<Resource> serveAvatar(@Parameter(description = "Avatar filename") @PathVariable String filename) {
        Resource resource = fileStorageService.loadAvatar(filename);
        MediaType mediaType = resolveMediaType(filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }

    @Operation(summary = "Download university branding logo", description = "Public endpoint serving uploaded university logos.")
    @GetMapping("/branding/{filename:.+}")
    public ResponseEntity<Resource> serveBrandingLogo(@Parameter(description = "Logo filename") @PathVariable String filename) {
        Resource resource = fileStorageService.loadBrandingLogo(filename);
        MediaType mediaType = resolveMediaType(filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }

    @Operation(summary = "Download event cover image", description = "Public endpoint serving uploaded campus event cover images.")
    @GetMapping("/events/{filename:.+}")
    public ResponseEntity<Resource> serveEventImage(@Parameter(description = "Event image filename") @PathVariable String filename) {
        Resource resource = fileStorageService.loadEventImage(filename);
        MediaType mediaType = resolveMediaType(filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }

    @Operation(
            summary = "Download protected payment receipt",
            description = "Requires authentication. Accessible only to the application owner or ADMIN users.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Receipt file returned"),
            @ApiResponse(responseCode = "403", description = "Access denied", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Receipt not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/receipts/{filename:.+}")
    public ResponseEntity<Resource> serveReceipt(
            @Parameter(description = "Receipt filename") @PathVariable String filename,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getUser().getRole() == Role.ADMIN;
        if (!applicationService.canAccessReceipt(filename, principal.getId(), isAdmin)) {
            throw new ForbiddenOperationException("You do not have permission to view this payment receipt.");
        }
        Resource resource = fileStorageService.loadReceipt(filename);
        MediaType mediaType = resolveMediaType(filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.noStore())
                .body(resource);
    }

    private MediaType resolveMediaType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        if (lower.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        return MediaType.IMAGE_JPEG;
    }
}
