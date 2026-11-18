package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.university.uems.entity.UniversityBranding;

import java.util.Optional;

public interface UniversityBrandingRepository extends JpaRepository<UniversityBranding, Long> {
    Optional<UniversityBranding> findFirstByOrderByIdAsc();
}
