package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.*;
import uz.university.uems.entity.CancellationStatus;
import uz.university.uems.entity.RefundStatus;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.CancellationService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CancellationController {

    private final CancellationService cancellationService;

    @GetMapping("/cancellation-policy")
    public ResponseEntity<CancellationPolicyDto> getPolicy() {
        return ResponseEntity.ok(cancellationService.getActivePolicy());
    }

    @PostMapping("/applications/{id}/cancellation-request")
    public ResponseEntity<CancellationRequestDto> requestCancellation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCancellationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cancellationService.requestCancellation(id, principal.getId(), request));
    }

    @GetMapping("/cancellations/my")
    public ResponseEntity<List<CancellationRequestDto>> myCancellations(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cancellationService.getMyCancellations(principal.getId()));
    }

    @GetMapping("/admin/cancellations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<CancellationRequestDto>> listAll(
            @RequestParam(required = false) CancellationStatus status,
            @RequestParam(required = false) RefundStatus refundStatus,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(cancellationService.listAllCancellations(status, refundStatus, search, page, size));
    }

    @PostMapping("/admin/cancellations/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> approveCancellation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(cancellationService.approveCancellation(id, principal.getUser(), comment));
    }

    @PostMapping("/admin/cancellations/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> rejectCancellation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(cancellationService.rejectCancellation(id, principal.getUser(), request.getComment()));
    }

    @PostMapping("/admin/cancellations/{id}/complete-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> completeRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteRefundRequest request) {
        return ResponseEntity.ok(cancellationService.completeRefund(id, principal.getUser(), request));
    }

    @PostMapping("/admin/cancellations/{id}/reject-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> rejectRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(cancellationService.rejectRefund(id, principal.getUser(), request.getComment()));
    }

    @PutMapping("/admin/cancellation-policy")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationPolicyDto> updatePolicy(
            @Valid @RequestBody UpdateCancellationPolicyRequest request) {
        return ResponseEntity.ok(cancellationService.updatePolicy(request));
    }

    @GetMapping("/admin/financial-audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<FinancialAuditLogDto>> financialAudit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(cancellationService.getFinancialAuditLogs(page, size));
    }
}
