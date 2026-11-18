package uz.university.uems.controller;

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
import uz.university.uems.entity.Role;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.FileStorageService;
import uz.university.uems.service.HallApplicationService;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;
    private final HallApplicationService applicationService;

    @GetMapping("/avatars/{filename:.+}")
    public ResponseEntity<Resource> serveAvatar(@PathVariable String filename) {
        Resource resource = fileStorageService.loadAvatar(filename);
        MediaType mediaType = resolveMediaType(filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }

    @GetMapping("/branding/{filename:.+}")
    public ResponseEntity<Resource> serveBrandingLogo(@PathVariable String filename) {
        Resource resource = fileStorageService.loadBrandingLogo(filename);
        MediaType mediaType = resolveMediaType(filename);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .cacheControl(CacheControl.maxAge(1, TimeUnit.DAYS).cachePublic())
                .body(resource);
    }

    @GetMapping("/receipts/{filename:.+}")
    public ResponseEntity<Resource> serveReceipt(
            @PathVariable String filename,
            @AuthenticationPrincipal UserPrincipal principal) {
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
