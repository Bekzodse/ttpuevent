package uz.university.uems.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import uz.university.uems.entity.FinancialAuditLog;

public interface FinancialAuditLogRepository extends JpaRepository<FinancialAuditLog, Long> {
    Page<FinancialAuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
