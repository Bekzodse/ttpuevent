package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import uz.university.uems.entity.UniversityEvent;

import java.util.List;

public interface UniversityEventRepository
        extends JpaRepository<UniversityEvent, Long>, JpaSpecificationExecutor<UniversityEvent> {

    List<UniversityEvent> findAllByOrderByEventDateAsc();

    List<UniversityEvent> findByPublishedTrueOrderByEventDateAsc();

    long countByStatusIgnoreCase(String status);

    long countByPublishedTrue();

    long countByPublishedFalse();

    List<UniversityEvent> findTop6ByOrderByRegisteredCountDesc();

    boolean existsByTitleIgnoreCase(String title);
}
