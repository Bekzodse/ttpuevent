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
@Tag(name = "Applications")
public class HallApplicationController {

    private final HallApplicationService applicationService;

    @Operation(
            summary = "List active university event halls",
            description = "Public endpoint returning active halls, capacities, amenities, and hourly rates.",
            tags = {"Bookings"}
    )
    @ApiResponse(responseCode = "200", description = "Active event halls list")
    @GetMapping("/halls")
    public ResponseEntity<List<EventHallDto>> listHalls() {
        return ResponseEntity.ok(applicationService.listActiveHalls());
    }

    @Operation(
            summary = "Submit a new hall booking application",
            description = "Requires authentication (USER or ADMIN). Checks hall conflicts and equipment stock, calculates total fee, and notifies admins.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Application submitted", content = @Content(schema = @Schema(implementation = HallApplicationDto.class))),
            @ApiResponse(responseCode = "400", description = "Validation or capacity error", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Hall or equipment time-slot conflict", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/applications")
    public ResponseEntity<HallApplicationDto> submitApplication(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateHallApplicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.submitApplication(principal.getId(), request));
    }

    @Operation(
            summary = "List my hall applications",
            description = "Requires authentication (USER or ADMIN).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "User's hall booking applications")
    @GetMapping("/applications/my")
    public ResponseEntity<List<HallApplicationDto>> getMyApplications(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getMyApplications(principal.getId()));
    }

    @Operation(
            summary = "Get hall application details",
            description = "Requires authentication. Accessible by the applicant or any ADMIN.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Application details returned", content = @Content(schema = @Schema(implementation = HallApplicationDto.class))),
            @ApiResponse(responseCode = "403", description = "Not application owner or admin", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/applications/{id}")
    public ResponseEntity<HallApplicationDto> getApplication(
            @Parameter(description = "Application ID", example = "1") @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAdmin = principal.getUser().getRole() == Role.ADMIN;
        return ResponseEntity.ok(applicationService.getApplicationDetails(id, principal.getId(), isAdmin));
    }

    @Operation(
            summary = "Reply to admin information request",
            description = "Requires authentication (applicant). Moves UNDER_REVIEW application back to PENDING.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Reply submitted", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PostMapping("/applications/{id}/reply")
    public ResponseEntity<HallApplicationDto> replyToInfoRequest(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserInfoReplyRequest request) {
        return ResponseEntity.ok(applicationService.replyToInfoRequest(id, principal.getId(), request));
    }

    @Operation(
            summary = "Upload payment receipt for an approved hall booking",
            description = "Requires authentication (applicant). Accepts PNG, JPG, WEBP, GIF, or PDF up to 5 MB when status is PAYMENT_PENDING or PAYMENT_REJECTED.",
            tags = {"Payments"},
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Receipt uploaded; status moved to PAYMENT_UNDER_REVIEW", content = @Content(schema = @Schema(implementation = HallApplicationDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid status, expired hold, or unsupported file", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping(value = "/applications/{id}/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HallApplicationDto> uploadReceipt(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "Receipt image or PDF file (max 5MB)", required = true) @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(applicationService.uploadReceipt(id, principal.getId(), file));
    }

    @Operation(
            summary = "Cancel an unpaid hall application",
            description = "Requires authentication (applicant). Paid/confirmed bookings must use /api/applications/{id}/cancellation-request.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Application cancelled", content = @Content(schema = @Schema(implementation = HallApplicationDto.class)))
    @PostMapping("/applications/{id}/cancel")
    public ResponseEntity<HallApplicationDto> cancelApplication(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(applicationService.cancelApplication(id, principal.getId()));
    }

    @Operation(
            summary = "Download official PDF booking confirmation",
            description = "Requires authentication (owner or ADMIN). Available only when booking status is CONFIRMED.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "PDF confirmation document stream")
    @GetMapping("/applications/{id}/confirmation-pdf")
    public ResponseEntity<byte[]> downloadConfirmationPdf(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
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
