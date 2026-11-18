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
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.*;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.EventService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/events")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Events")
@SecurityRequirement(name = "bearerAuth")
public class AdminEventController {

    private final EventService eventService;

    @Operation(summary = "List all events with search, filtering, and sorting (ADMIN)", description = "Requires ADMIN role. Includes unpublished drafts and cancelled events.")
    @ApiResponse(responseCode = "200", description = "Paginated events list returned")
    @GetMapping
    public ResponseEntity<PagedResponse<EventDto>> listEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "eventDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(eventService.listEventsAdmin(
                search, category, status, published, sortBy, sortDir, page, size));
    }

    @Operation(summary = "Get any event by ID (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Event details returned", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @GetMapping("/{id}")
    public ResponseEntity<EventDto> getEvent(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventAdmin(id));
    }

    @Operation(summary = "Create event as admin (ADMIN)", description = "Requires ADMIN role. Records an EVENT_CREATED activity log.")
    @ApiResponse(responseCode = "201", description = "Event created", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @PostMapping
    public ResponseEntity<EventDto> createEvent(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.createEventAdmin(request, principal.getUser()));
    }

    @Operation(summary = "Update an existing event (ADMIN)", description = "Requires ADMIN role. Validates capacity >= current registered count.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Event updated", content = @Content(schema = @Schema(implementation = EventDto.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input or capacity below registered count", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<EventDto> updateEvent(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.updateEventAdmin(id, request, principal.getUser()));
    }

    @Operation(summary = "Upload event cover image (ADMIN)", description = "Requires ADMIN role. Accepts PNG, JPG, WEBP, or GIF up to 5 MB.")
    @ApiResponse(responseCode = "200", description = "Event image updated", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EventDto> uploadImage(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "Event cover image file", required = true) @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(eventService.uploadEventImage(id, file, principal.getUser()));
    }

    @Operation(summary = "Remove event cover image (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Event image removed", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @DeleteMapping("/{id}/image")
    public ResponseEntity<EventDto> deleteImage(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.deleteEventImage(id, principal.getUser()));
    }

    @Operation(summary = "Publish event (ADMIN)", description = "Requires ADMIN role. Makes the event publicly visible.")
    @ApiResponse(responseCode = "200", description = "Event published", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @PatchMapping("/{id}/publish")
    public ResponseEntity<EventDto> publishEvent(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.publishEvent(id, principal.getUser()));
    }

    @Operation(summary = "Unpublish event (ADMIN)", description = "Requires ADMIN role. Hides the event from public listings.")
    @ApiResponse(responseCode = "200", description = "Event unpublished", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @PatchMapping("/{id}/unpublish")
    public ResponseEntity<EventDto> unpublishEvent(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.unpublishEvent(id, principal.getUser()));
    }

    @Operation(summary = "Cancel event (ADMIN)", description = "Requires ADMIN role. Sets status to Cancelled and closes registrations.")
    @ApiResponse(responseCode = "200", description = "Event cancelled", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<EventDto> cancelEvent(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(eventService.cancelEvent(id, principal.getUser()));
    }

    @Operation(summary = "Update event status (ADMIN)", description = "Requires ADMIN role. Sets status to Upcoming, Completed, Cancelled, or Draft.")
    @ApiResponse(responseCode = "200", description = "Event status updated", content = @Content(schema = @Schema(implementation = EventDto.class)))
    @PatchMapping("/{id}/status")
    public ResponseEntity<EventDto> updateEventStatus(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AdminEventStatusRequest request) {
        return ResponseEntity.ok(eventService.updateEventStatus(id, request, principal.getUser()));
    }

    @Operation(summary = "Delete event permanently (ADMIN)", description = "Requires ADMIN role. Deletes the event, its registrations, and uploaded cover image.")
    @ApiResponse(responseCode = "200", description = "Event deleted")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(
            @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        eventService.deleteEvent(id, principal.getUser());
        return ResponseEntity.ok(Map.of("message", "Event deleted successfully."));
    }

    @Operation(summary = "List event registered participants (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Registrants returned")
    @GetMapping("/{id}/registrations")
    public ResponseEntity<List<EventRegistrantDto>> getRegistrations(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventRegistrations(id));
    }
}
