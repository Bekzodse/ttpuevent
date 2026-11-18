package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.university.uems.entity.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop40ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    int markAllReadByRecipientId(@Param("recipientId") Long recipientId);

    @Modifying
    void deleteByRecipientId(Long recipientId);
}
