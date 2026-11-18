package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import uz.university.uems.entity.AdminActivityLog;

import java.util.List;

public interface AdminActivityLogRepository
        extends JpaRepository<AdminActivityLog, Long>, JpaSpecificationExecutor<AdminActivityLog> {

    List<AdminActivityLog> findTop10ByOrderByCreatedAtDesc();
}
