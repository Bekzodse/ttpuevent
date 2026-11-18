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
import java.util.Map;

@RestController
@RequestMapping("/api/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Applications")
@SecurityRequirement(name = "bearerAuth")
public class AdminApplicationController {

    private final HallApplicationService applicationService;

    @Operation(
            summary = "Get hall application status statistics (ADMIN)",
            description = "Requires ADMIN role. Expires overdue holds and returns counts per booking status.",
            tags = {"Statistics"}
    )
    @ApiResponse(responseCode = "200", description = "Application status counts", content = @Content(schema = @Schema(implementation = ApplicationStatsDto.class)))
    @GetMapping("/stats")
    public ResponseEntity<ApplicationStatsDto> getStats() {
        return ResponseEntity.ok(applicationService.getApplicationStats());
    }

    @Operation(summary = "List and filter all hall applications (ADMIN)", description = "Requires ADMIN role. Supports search, status, hallId, eventType, eventDate, submittedDate, sorting, and pagination.")
    @ApiResponse(responseCode = "200", description = "Paginated applications returned")
    @GetMapping
    public ResponseEntity<PagedResponse<HallApplicationDto>> listApplications(
            @Parameter(description = "Search code, event name, applicant name/email/phone/username") @RequestParam(required = false) String search,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) Long hallId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate eventDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate submittedDate,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(applicationService.listAllApplications(
                search, status, hallId, eventType, eventDate, submittedDate, sortBy, sortDir, page, size));
    }

    @Operation(summary = "Get full application details (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Application details returned", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @GetMapping("/{id}")
    public ResponseEntity<HallApplicationDto> getApplication(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getApplicationDetails(id, principal.getId(), true));
    }

    @Operation(summary = "Approve application and create 24h payment hold (ADMIN)", description = "Requires ADMIN role. Moves PENDING/UNDER_REVIEW to PAYMENT_PENDING.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Application approved", content = @Content(schema = @Schema(implementation = HallApplicationDto.class))),
            @ApiResponse(responseCode = "409", description = "Hall conflict", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/approve")
    public ResponseEntity<HallApplicationDto> approveApplication(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(applicationService.approveApplication(id, principal.getUser(), comment));
    }

    @Operation(summary = "Reject application with reason (ADMIN)", description = "Requires ADMIN role. Releases reserved equipment and notifies applicant.")
    @ApiResponse(responseCode = "200", description = "Application rejected", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PostMapping("/{id}/reject")
    public ResponseEntity<HallApplicationDto> rejectApplication(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(applicationService.rejectApplication(id, principal.getUser(), request.getComment()));
    }

    @Operation(summary = "Request additional information from applicant (ADMIN)", description = "Requires ADMIN role. Moves status to UNDER_REVIEW.")
    @ApiResponse(responseCode = "200", description = "Information requested", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PostMapping("/{id}/request-info")
    public ResponseEntity<HallApplicationDto> requestInfo(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(applicationService.requestAdditionalInfo(id, principal.getUser(), request.getComment()));
    }

    @Operation(
            summary = "Approve payment receipt and confirm booking (ADMIN)",
            description = "Requires ADMIN role. Verifies PAYMENT_UNDER_REVIEW receipt, sets CONFIRMED, and records financial audit log.",
            tags = {"Payments"}
    )
    @ApiResponse(responseCode = "200", description = "Payment approved & booking confirmed", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PostMapping("/{id}/approve-payment")
    public ResponseEntity<HallApplicationDto> approvePayment(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(applicationService.approvePayment(id, principal.getUser(), comment));
    }

    @Operation(
            summary = "Reject uploaded payment receipt (ADMIN)",
            description = "Requires ADMIN role. Moves status to PAYMENT_REJECTED and notifies user to re-upload.",
            tags = {"Payments"}
    )
    @ApiResponse(responseCode = "200", description = "Payment rejected", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PostMapping("/{id}/reject-payment")
    public ResponseEntity<HallApplicationDto> rejectPayment(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(applicationService.rejectPayment(id, principal.getUser(), request.getComment()));
    }

    @Operation(summary = "Directly change application status (ADMIN)", description = "Requires ADMIN role. Allows transitioning status (PENDING, APPROVED, REJECTED, CANCELLED, CONFIRMED, UNDER_REVIEW).")
    @ApiResponse(responseCode = "200", description = "Status updated", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PatchMapping("/{id}/status")
    public ResponseEntity<HallApplicationDto> changeStatus(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminApplicationStatusRequest request) {
        return ResponseEntity.ok(applicationService.changeApplicationStatus(
                id, principal.getUser(), request.getStatus(), request.getComment()));
    }

    @Operation(summary = "Delete application permanently (ADMIN)", description = "Requires ADMIN role. Deletes application, equipment reservations, history, cancellation requests, and receipt file.")
    @ApiResponse(responseCode = "200", description = "Application deleted")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteApplication(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        applicationService.deleteApplication(id, principal.getUser());
        return ResponseEntity.ok(Map.of("message", "Application deleted successfully."));
    }
}
