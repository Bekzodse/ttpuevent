package uz.university.uems.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.NotificationDto;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.getMyNotifications(principal.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(principal.getId())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(notificationService.markRead(id, principal.getId()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read."));
    }
}
