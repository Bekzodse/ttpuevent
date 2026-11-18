package uz.university.uems.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import uz.university.uems.entity.CancellationRequest;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CancellationRequestRepository
        extends JpaRepository<CancellationRequest, Long>, JpaSpecificationExecutor<CancellationRequest> {

    @EntityGraph(attributePaths = {"application", "application.hall", "requestedBy"})
    Optional<CancellationRequest> findByApplicationId(Long applicationId);

    @EntityGraph(attributePaths = {"application", "application.hall", "requestedBy"})
    List<CancellationRequest> findByRequestedByIdOrderByRequestedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"application", "application.hall", "requestedBy"})
    Optional<CancellationRequest> findWithDetailsById(Long id);

    boolean existsByApplicationId(Long applicationId);

    @Modifying
    void deleteByApplicationIdIn(Collection<Long> applicationIds);
}
