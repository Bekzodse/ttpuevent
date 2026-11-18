package uz.university.uems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Payments")
public class CancellationController {

    private final CancellationService cancellationService;

    @Operation(summary = "Get active cancellation & refund policy", description = "Public endpoint returning refund eligibility thresholds.")
    @ApiResponse(responseCode = "200", description = "Policy returned", content = @Content(schema = @Schema(implementation = CancellationPolicyDto.class)))
    @GetMapping("/cancellation-policy")
    public ResponseEntity<CancellationPolicyDto> getPolicy() {
        return ResponseEntity.ok(cancellationService.getActivePolicy());
    }

    @Operation(summary = "Request cancellation & refund for a booking", description = "Requires authentication (applicant). Calculates eligible refund based on active policy.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "201", description = "Cancellation request submitted", content = @Content(schema = @Schema(implementation = CancellationRequestDto.class)))
    @PostMapping("/applications/{id}/cancellation-request")
    public ResponseEntity<CancellationRequestDto> requestCancellation(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCancellationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cancellationService.requestCancellation(id, principal.getId(), request));
    }

    @Operation(summary = "List my cancellation & refund requests", description = "Requires authentication.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "User's cancellation requests returned")
    @GetMapping("/cancellations/my")
    public ResponseEntity<List<CancellationRequestDto>> myCancellations(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(cancellationService.getMyCancellations(principal.getId()));
    }

    @Operation(summary = "List all cancellation & refund requests (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Paginated cancellation requests")
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

    @Operation(summary = "Approve cancellation request (ADMIN)", description = "Requires ADMIN role. Releases hall slot if configured in policy.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Cancellation approved", content = @Content(schema = @Schema(implementation = CancellationRequestDto.class)))
    @PostMapping("/admin/cancellations/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> approveCancellation(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(cancellationService.approveCancellation(id, principal.getUser(), comment));
    }

    @Operation(summary = "Reject cancellation request (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Cancellation rejected", content = @Content(schema = @Schema(implementation = CancellationRequestDto.class)))
    @PostMapping("/admin/cancellations/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> rejectCancellation(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(cancellationService.rejectCancellation(id, principal.getUser(), request.getComment()));
    }

    @Operation(summary = "Complete refund with bank transaction reference (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Refund completed", content = @Content(schema = @Schema(implementation = CancellationRequestDto.class)))
    @PostMapping("/admin/cancellations/{id}/complete-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> completeRefund(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteRefundRequest request) {
        return ResponseEntity.ok(cancellationService.completeRefund(id, principal.getUser(), request));
    }

    @Operation(summary = "Reject refund request (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Refund rejected", content = @Content(schema = @Schema(implementation = CancellationRequestDto.class)))
    @PostMapping("/admin/cancellations/{id}/reject-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationRequestDto> rejectRefund(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(cancellationService.rejectRefund(id, principal.getUser(), request.getComment()));
    }

    @Operation(summary = "Update cancellation & refund policy (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Policy updated", content = @Content(schema = @Schema(implementation = CancellationPolicyDto.class)))
    @PutMapping("/admin/cancellation-policy")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CancellationPolicyDto> updatePolicy(
            @Valid @RequestBody UpdateCancellationPolicyRequest request) {
        return ResponseEntity.ok(cancellationService.updatePolicy(request));
    }

    @Operation(summary = "List financial audit logs (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Paginated financial audit logs")
    @GetMapping("/admin/financial-audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<FinancialAuditLogDto>> financialAudit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(cancellationService.getFinancialAuditLogs(page, size));
    }
}
