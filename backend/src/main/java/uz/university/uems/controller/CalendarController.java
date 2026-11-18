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
import uz.university.uems.dto.CalendarResponseDto;
import uz.university.uems.dto.CreateScheduleBlockRequest;
import uz.university.uems.dto.HallScheduleBlockDto;
import uz.university.uems.dto.TimeSlotAvailabilityDto;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.CalendarService;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Bookings")
public class CalendarController {

    private final CalendarService calendarService;

    @Operation(summary = "Get hall calendar events and blocks", description = "Public endpoint returning active bookings and admin schedule blocks within a date range.")
    @ApiResponse(responseCode = "200", description = "Calendar returned", content = @Content(schema = @Schema(implementation = CalendarResponseDto.class)))
    @GetMapping("/calendar")
    public ResponseEntity<CalendarResponseDto> getCalendar(
            @Parameter(description = "Range start date (YYYY-MM-DD)", example = "2026-11-01", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Range end date (YYYY-MM-DD)", example = "2026-11-30", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Optional hall ID filter") @RequestParam(required = false) Long hallId) {
        return ResponseEntity.ok(calendarService.getCalendar(startDate, endDate, hallId));
    }

    @Operation(summary = "Get hourly availability slots for a hall on a date", description = "Public endpoint returning hourly slot states (AVAILABLE, RESERVED, CONFIRMED, PENDING, BLOCKED).")
    @ApiResponse(responseCode = "200", description = "Daily hourly availability returned")
    @GetMapping("/calendar/availability")
    public ResponseEntity<List<TimeSlotAvailabilityDto>> getDailyAvailability(
            @Parameter(description = "Event Hall ID", example = "1", required = true) @RequestParam Long hallId,
            @Parameter(description = "Target date (YYYY-MM-DD)", example = "2026-12-15", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(calendarService.getDailyAvailability(hallId, date));
    }

    @Operation(
            summary = "Block a hall time slot (ADMIN)",
            description = "Requires ADMIN role. Prevents bookings during maintenance, university reservations, or closures.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "201", description = "Schedule block created", content = @Content(schema = @Schema(implementation = HallScheduleBlockDto.class)))
    @PostMapping("/admin/calendar/blocks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HallScheduleBlockDto> createBlock(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateScheduleBlockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calendarService.createScheduleBlock(request, principal.getUser()));
    }

    @Operation(
            summary = "Remove a hall schedule block (ADMIN)",
            description = "Requires ADMIN role.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Schedule block removed")
    @DeleteMapping("/admin/calendar/blocks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteBlock(@PathVariable Long id) {
        calendarService.deleteScheduleBlock(id);
        return ResponseEntity.ok(Map.of("message", "Schedule block removed."));
    }
}
