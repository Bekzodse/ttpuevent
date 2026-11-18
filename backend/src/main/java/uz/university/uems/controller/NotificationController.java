package uz.university.uems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.ErrorResponse;
import uz.university.uems.dto.NotificationDto;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "List my notifications", description = "Authenticated (USER or ADMIN). Returns up to 40 most recent notifications.")
    @ApiResponse(responseCode = "200", description = "Notifications retrieved")
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getId()));
    }

    @Operation(summary = "Get unread notification count", description = "Authenticated (USER or ADMIN).")
    @ApiResponse(responseCode = "200", description = "Unread counter returned")
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(principal.getId())));
    }

    @Operation(summary = "Mark notification as read", description = "Authenticated (USER or ADMIN). Only the recipient may mark a notification read.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Notification marked as read",
                    content = @Content(schema = @Schema(implementation = NotificationDto.class))),
            @ApiResponse(responseCode = "403", description = "Not notification recipient",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Notification not found",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markRead(
            @Parameter(description = "Notification ID", example = "12") @PathVariable Long id,
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.markRead(id, principal.getId()));
    }

    @Operation(summary = "Mark all notifications as read", description = "Authenticated (USER or ADMIN).")
    @ApiResponse(responseCode = "200", description = "All notifications marked as read")
    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}
