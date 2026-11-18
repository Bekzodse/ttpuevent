package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.university.uems.entity.UniversityEvent;

import java.util.List;

public interface UniversityEventRepository extends JpaRepository<UniversityEvent, Long> {
    List<UniversityEvent> findAllByOrderByEventDateAsc();
}
