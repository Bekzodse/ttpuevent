package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.NotificationDto;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.HallApplication;
import uz.university.uems.entity.Notification;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.NotificationRepository;
import uz.university.uems.repository.UserRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void notifyUser(
            User recipient,
            String title,
            String message,
            String type,
            HallApplication application) {
        Notification saved = notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .type(type)
                .applicationId(application != null ? application.getId() : null)
                .applicationCode(application != null ? application.getApplicationCode() : null)
                .bookingStatus(application != null ? application.getStatus() : null)
                .read(false)
                .build());

        NotificationDto dto = NotificationDto.from(saved);
        try {
            messagingTemplate.convertAndSendToUser(
                    recipient.getUsername(), "/queue/notifications", dto);
        } catch (Exception ex) {
            log.debug("WebSocket push skipped for user {}: {}", recipient.getUsername(), ex.getMessage());
        }
    }

    @Transactional
    public void notifyAdmins(
            String title,
            String message,
            String type,
            HallApplication application) {
        List<User> admins = userRepository.findAll((root, query, cb) ->
                cb.and(
                        cb.equal(root.get("role"), Role.ADMIN),
                        cb.isTrue(root.get("active"))
                ));

        for (User admin : admins) {
            notifyUser(admin, title, message, type, application);
        }

        if (application != null) {
            try {
                messagingTemplate.convertAndSend(
                        "/topic/admin/applications",
                        NotificationDto.builder()
                                .title(title)
                                .message(message)
                                .type(type)
                                .applicationId(application.getId())
                                .applicationCode(application.getApplicationCode())
                                .bookingStatus(application.getStatus())
                                .build()
                );
            } catch (Exception ex) {
                log.debug("Admin topic broadcast skipped: {}", ex.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications(Long userId) {
        return notificationRepository.findTop40ByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public NotificationDto markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        if (!n.getRecipient().getId().equals(userId)) {
            throw new ForbiddenOperationException("You cannot modify another user's notification.");
        }
        n.setRead(true);
        return NotificationDto.from(notificationRepository.save(n));
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByRecipientId(userId);
    }
}
