package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.university.uems.entity.CancellationPolicy;

import java.util.Optional;

public interface CancellationPolicyRepository extends JpaRepository<CancellationPolicy, Long> {
    Optional<CancellationPolicy> findFirstByActiveTrueOrderByIdAsc();
}
