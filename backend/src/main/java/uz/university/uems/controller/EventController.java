package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.CreateEventRequest;
import uz.university.uems.dto.EventDto;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventDto>> listEvents(@AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(eventService.listEvents(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(eventService.getEvent(id, userId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<EventDto>> myEvents(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.getMyEvents(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<EventDto> registerForEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.registerForEvent(id, principal.getId()));
    }

    @DeleteMapping("/{id}/register")
    public ResponseEntity<EventDto> unregisterFromEvent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.unregisterFromEvent(id, principal.getId()));
    }
}
