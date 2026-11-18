package uz.university.uems.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.university.uems.entity.EventHall;

import java.util.List;
import java.util.Optional;

public interface EventHallRepository extends JpaRepository<EventHall, Long> {

    List<EventHall> findByActiveTrueOrderByNameAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM EventHall h WHERE h.id = :id")
    Optional<EventHall> findByIdForUpdate(@Param("id") Long id);
}
