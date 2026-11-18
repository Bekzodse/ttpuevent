package uz.university.uems.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;

import java.time.Instant;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    long countByActiveTrue();

    long countByActiveFalse();

    long countByRole(Role role);

    long countByLastLoginAtIsNotNull();

    long countByActiveTrueAndLastActivityAtAfter(Instant cutoff);

    @Modifying
    @Query("UPDATE User u SET u.lastActivityAt = :now WHERE u.id = :id")
    void updateLastActivity(@Param("id") Long id, @Param("now") Instant now);
}
