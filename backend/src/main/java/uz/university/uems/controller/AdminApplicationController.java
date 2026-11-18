package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.*;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.HallApplicationService;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final HallApplicationService applicationService;

    @GetMapping("/stats")
    public ResponseEntity<ApplicationStatsDto> getStats() {
        return ResponseEntity.ok(applicationService.getApplicationStats());
    }

    @GetMapping
    public ResponseEntity<PagedResponse<HallApplicationDto>> listApplications(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long hallId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(applicationService.listAllApplications(
                search, status, hallId, eventType, eventDate, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HallApplicationDto> getApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getApplicationDetails(id, principal.getId(), true));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<HallApplicationDto> approveApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(applicationService.approveApplication(id, principal.getUser(), comment));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<HallApplicationDto> rejectApplication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(applicationService.rejectApplication(id, principal.getUser(), request.getComment()));
    }

    @PostMapping("/{id}/request-info")
    public ResponseEntity<HallApplicationDto> requestInfo(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(applicationService.requestAdditionalInfo(id, principal.getUser(), request.getComment()));
    }

    @PostMapping("/{id}/approve-payment")
    public ResponseEntity<HallApplicationDto> approvePayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(applicationService.approvePayment(id, principal.getUser(), comment));
    }

    @PostMapping("/{id}/reject-payment")
    public ResponseEntity<HallApplicationDto> rejectPayment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(applicationService.rejectPayment(id, principal.getUser(), request.getComment()));
    }
}
