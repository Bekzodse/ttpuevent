package uz.university.uems.controller;

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
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping("/equipment")
    public ResponseEntity<List<EquipmentDto>> listAvailableEquipment(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        return ResponseEntity.ok(equipmentService.listAvailableEquipment(date, startTime, endTime));
    }

    @GetMapping("/admin/equipment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EquipmentDto>> listAllAdmin() {
        return ResponseEntity.ok(equipmentService.listAllEquipmentAdmin());
    }

    @PostMapping("/admin/equipment")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentDto> create(@Valid @RequestBody EquipmentRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.createEquipment(request));
    }

    @PutMapping("/admin/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentDto> update(
            @PathVariable Long id,
            @Valid @RequestBody EquipmentRequestDto request) {
        return ResponseEntity.ok(equipmentService.updateEquipment(id, request));
    }

    @PatchMapping("/admin/equipment/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentDto> toggleStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(equipmentService.toggleStatus(id, request.getActive()));
    }

    @DeleteMapping("/admin/equipment/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        equipmentService.deleteEquipment(id);
        return ResponseEntity.ok(Map.of("message", "Equipment item deleted."));
    }

    @GetMapping("/admin/equipment/{id}/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EquipmentHistoryItemDto>> history(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getEquipmentHistory(id));
    }

    @PostMapping("/admin/applications/{appId}/equipment/{resId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentReservationDto> approveRequest(
            @PathVariable Long appId,
            @PathVariable Long resId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody(required = false) AdminOptionalCommentRequest request) {
        String comment = request != null ? request.getComment() : null;
        return ResponseEntity.ok(equipmentService.approveEquipmentRequest(appId, resId, principal.getUser(), comment));
    }

    @PostMapping("/admin/applications/{appId}/equipment/{resId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EquipmentReservationDto> rejectRequest(
            @PathVariable Long appId,
            @PathVariable Long resId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminDecisionRequest request) {
        return ResponseEntity.ok(equipmentService.rejectEquipmentRequest(appId, resId, principal.getUser(), request.getComment()));
    }
}
