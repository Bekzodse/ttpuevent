package uz.university.uems.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import uz.university.uems.entity.EventRegistration;

import java.util.List;
import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    boolean existsByEventIdAndUserId(Long eventId, Long userId);

    Optional<EventRegistration> findByEventIdAndUserId(Long eventId, Long userId);

    @EntityGraph(attributePaths = {"event"})
    List<EventRegistration> findByUserIdOrderByRegisteredAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user", "event"})
    List<EventRegistration> findTop10ByOrderByRegisteredAtDesc();

    @Modifying
    void deleteByUserId(Long userId);

    @Modifying
    void deleteByEventId(Long eventId);
}
