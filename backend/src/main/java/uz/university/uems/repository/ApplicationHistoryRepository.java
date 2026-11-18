package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import uz.university.uems.entity.ApplicationHistory;

import java.util.Collection;
import java.util.List;

public interface ApplicationHistoryRepository extends JpaRepository<ApplicationHistory, Long> {

    List<ApplicationHistory> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    @Modifying
    void deleteByApplicationIdIn(Collection<Long> applicationIds);
}
