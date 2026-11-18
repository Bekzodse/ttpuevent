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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.CreateEventRequest;
import uz.university.uems.dto.ErrorResponse;
import uz.university.uems.dto.EventDto;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@Tag(name = "Events")
public class EventController {

    private final EventService eventService;

    @Operation(summary = "List published campus events", description = "Public endpoint. If authenticated, marks `userRegistered=true` for events the user has joined.")
    @ApiResponse(responseCode = "200", description = "List of published events")
    @GetMapping
    public ResponseEntity<List<EventDto>> listEvents(@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(eventService.listEvents(userId));
    }

    @Operation(summary = "Get campus event details", description = "Public endpoint returning a single event by ID.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Event found", content = @Content(schema = @Schema(implementation = EventDto.class))),
            @ApiResponse(responseCode = "404", description = "Event not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEvent(
            @Parameter(description = "Event ID", example = "1") @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(eventService.getEvent(id, userId));
    }

    @Operation(
            summary = "Get events the current user registered for",
            description = "Requires authentication (USER or ADMIN).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "User's registered events returned")
    @GetMapping("/my")
    public ResponseEntity<List<EventDto>> myEvents(@Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.getMyEvents(principal.getId()));
    }

    @Operation(
            summary = "Create a campus event",
            description = "Requires authentication (USER or ADMIN).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Event created", content = @Content(schema = @Schema(implementation = EventDto.class))),
            @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping
    public ResponseEntity<EventDto> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.createEvent(request));
    }

    @Operation(
            summary = "Register for a campus event",
            description = "Requires authentication (USER or ADMIN). Fails if unpublished, cancelled, completed, full, or already registered.",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Registered successfully", content = @Content(schema = @Schema(implementation = EventDto.class))),
            @ApiResponse(responseCode = "400", description = "Event closed or capacity full", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Already registered", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PostMapping("/{id}/register")
    public ResponseEntity<EventDto> registerForEvent(
            @Parameter(description = "Event ID", example = "1") @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.registerForEvent(id, principal.getId()));
    }

    @Operation(
            summary = "Unregister from a campus event",
            description = "Requires authentication (USER or ADMIN).",
            security = @SecurityRequirement(name = "bearerAuth")
    )
    @ApiResponse(responseCode = "200", description = "Unregistered successfully", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @DeleteMapping("/{id}/register")
    public ResponseEntity<EventDto> unregisterFromEvent(
            @Parameter(description = "Event ID", example = "1") @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.unregisterFromEvent(id, principal.getId()));
    }
}
