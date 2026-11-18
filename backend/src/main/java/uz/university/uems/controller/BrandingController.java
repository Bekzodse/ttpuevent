package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.UniversityBrandingDto;
import uz.university.uems.dto.UpdateBrandingRequest;
import uz.university.uems.service.BrandingService;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BrandingController {

    private final BrandingService brandingService;

    @GetMapping("/branding")
    public ResponseEntity<UniversityBrandingDto> getBranding() {
        return ResponseEntity.ok(brandingService.getBranding());
    }

    @PutMapping("/admin/branding")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityBrandingDto> updateBranding(
            @Valid @RequestBody UpdateBrandingRequest request) {
        return ResponseEntity.ok(brandingService.updateBranding(request));
    }

    @PostMapping(value = "/admin/branding/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityBrandingDto> uploadLogo(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(brandingService.uploadLogo(file));
    }

    @DeleteMapping("/admin/branding/logo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UniversityBrandingDto> deleteLogo() {
        return ResponseEntity.ok(brandingService.deleteLogo());
    }
}
