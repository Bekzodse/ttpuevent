package uz.university.uems.controller;

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
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping("/calendar")
    public ResponseEntity<CalendarResponseDto> getCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long hallId) {
        return ResponseEntity.ok(calendarService.getCalendar(startDate, endDate, hallId));
    }

    @GetMapping("/calendar/availability")
    public ResponseEntity<List<TimeSlotAvailabilityDto>> getDailyAvailability(
            @RequestParam Long hallId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(calendarService.getDailyAvailability(hallId, date));
    }

    @PostMapping("/admin/calendar/blocks")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HallScheduleBlockDto> createBlock(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateScheduleBlockRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(calendarService.createScheduleBlock(request, principal.getUser()));
    }

    @DeleteMapping("/admin/calendar/blocks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteBlock(@PathVariable Long id) {
        calendarService.deleteScheduleBlock(id);
        return ResponseEntity.ok(Map.of("message", "Schedule block removed."));
    }
}
