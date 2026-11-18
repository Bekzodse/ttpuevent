package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.*;
import uz.university.uems.entity.Role;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.HallApplicationService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HallApplicationController {

    private final HallApplicationService applicationService;

    @GetMapping("/halls")
    public ResponseEntity<List<EventHallDto>> listHalls() {
        return ResponseEntity.ok(applicationService.listActiveHalls());
    }

    @PostMapping("/applications")
    public ResponseEntity<HallApplicationDto> submitApplication(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateHallApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.submitApplication(principal.getId(), request));
    }

    @GetMapping("/applications/my")
    public ResponseEntity<List<HallApplicationDto>> getMyApplications(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getMyApplications(principal.getId()));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<HallApplicationDto> getApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getUser().getRole() == Role.ADMIN;
        return ResponseEntity.ok(applicationService.getApplicationDetails(id, principal.getId(), isAdmin));
    }

    @PostMapping("/applications/{id}/reply")
    public ResponseEntity<HallApplicationDto> replyToInfoRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserInfoReplyRequest request) {
        return ResponseEntity.ok(applicationService.replyToInfoRequest(id, principal.getId(), request));
    }

    @PostMapping(value = "/applications/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HallApplicationDto> uploadReceipt(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(applicationService.uploadReceipt(id, principal.getId(), file));
    }

    @PostMapping("/applications/{id}/cancel")
    public ResponseEntity<HallApplicationDto> cancelApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.cancelApplication(id, principal.getId()));
    }

    @GetMapping("/applications/{id}/confirmation-pdf")
    public ResponseEntity<byte[]> downloadConfirmationPdf(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getUser().getRole() == Role.ADMIN;
        HallApplicationDto details = applicationService.getApplicationDetails(id, principal.getId(), isAdmin);
        byte[] pdfBytes = applicationService.generateConfirmationPdf(id, principal.getId(), isAdmin);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment()
                        .filename("booking-confirmation-" + details.getApplicationCode() + ".pdf")
                        .build()
        );
        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
