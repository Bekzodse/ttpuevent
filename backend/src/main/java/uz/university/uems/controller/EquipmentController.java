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
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.*;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.EquipmentService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Bookings")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @Operation(summary = "List active equipment with live availability", description = "Public endpoint. Pass date, startTime, and endTime to compute remaining stock for a specific time slot.")
    @ApiResponse(responseCode = "200", description = "Equipment catalog returned")
    @GetMapping("/equipment")
    public ResponseEntity<List<EquipmentDto>> listAvailableEquipment(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        return ResponseEntity.ok(equipmentService.listAvailableEquipment(date, startTime, endTime));
    }

    @Operation(summary = "List all equipment items (ADMIN)", description = "Requires ADMIN role. Includes inactive equipment.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "All equipment items returned")
    @GetMapping("/admin/equipment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EquipmentDto>> listAllAdmin() {
        return ResponseEntity.ok(equipmentService.listAllEquipmentAdmin());
    }

    @Operation(summary = "Create equipment item (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "201", description = "Equipment created", content = @Content(schema = @Schema(implementation = EquipmentDto.class)))
    @PostMapping("/admin/equipment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentDto> create(@Valid @RequestBody EquipmentRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createEquipment(request));
    }

    @Operation(summary = "Update equipment item (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Equipment updated", content = @Content(schema = @Schema(implementation = EquipmentDto.class)))
    @PutMapping("/admin/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentDto> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentRequestDto request) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, request));
    }

    @Operation(summary = "Activate or deactivate equipment item (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Equipment status updated", content = @Content(schema = @Schema(implementation = EquipmentDto.class)))
    @PatchMapping("/admin/equipment/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentDto> toggleStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(equipmentService.toggleStatus(id, request.getActive()));
    }

    @Operation(summary = "Delete equipment item (ADMIN)", description = "Requires ADMIN role. Fails if reservation history exists.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Equipment deleted")
    @DeleteMapping("/admin/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.ok(Map.of("message", "Equipment item deleted."));
    }

    @Operation(summary = "Get equipment reservation history (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Equipment history returned")
    @GetMapping("/admin/equipment/{id}/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EquipmentHistoryItemDto>> history(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentHistory(id));
    }

    @Operation(summary = "Approve equipment reservation request (ADMIN)", description = "Requires ADMIN role.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Equipment request approved", content = @Content(schema = @Schema(implementation = EquipmentReservationDto.class)))
    @PostMapping("/admin/applications/{appId}/equipment/{resId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentReservationDto> approveRequest(
            @PathVariable Long appId,
            @PathVariable Long resId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(equipmentService.approveEquipmentRequest(appId, resId, principal.getUser(), comment));
    }

    @Operation(summary = "Reject equipment reservation request (ADMIN)", description = "Requires ADMIN role. Releases reserved quantity.", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponse(responseCode = "200", description = "Equipment request rejected", content = @Content(schema = @Schema(implementation = EquipmentReservationDto.class)))
    @PostMapping("/admin/applications/{appId}/equipment/{resId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentReservationDto> rejectRequest(
            @PathVariable Long appId,
            @PathVariable Long resId,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(equipmentService.rejectEquipmentRequest(appId, resId, principal.getUser(), request.getComment()));
    }
}
