package uz.university.uems.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import uz.university.uems.entity.LoginActivity;

import java.util.List;

public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {

    @EntityGraph(attributePaths = {"user"})
    Page<LoginActivity> findAllByOrderByLoginTimeDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    List<LoginActivity> findTop10ByUserIdOrderByLoginTimeDesc(Long userId);

    @Modifying
    void deleteByUserId(Long userId);
}
