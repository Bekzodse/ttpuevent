package uz.university.uems.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.HallApplication;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface HallApplicationRepository
        extends JpaRepository<HallApplication, Long>, JpaSpecificationExecutor<HallApplication> {

    @EntityGraph(attributePaths = {"hall", "applicant"})
    List<HallApplication> findByApplicantIdOrderByCreatedAtDesc(Long applicantId);

    @EntityGraph(attributePaths = {"hall", "applicant"})
    List<HallApplication> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"hall", "applicant"})
    Optional<HallApplication> findWithDetailsById(Long id);

    boolean existsByApplicationCode(String applicationCode);

    long countByStatus(BookingStatus status);

    @Query("""
        SELECT a FROM HallApplication a
        WHERE a.hall.id = :hallId
          AND a.eventDate = :eventDate
          AND (:excludeId IS NULL OR a.id <> :excludeId)
          AND a.startTime < :endTime
          AND a.endTime > :startTime
          AND (
            a.status = uz.university.uems.entity.BookingStatus.CONFIRMED
            OR (a.status IN (
                uz.university.uems.entity.BookingStatus.APPROVED,
                uz.university.uems.entity.BookingStatus.PAYMENT_PENDING,
                uz.university.uems.entity.BookingStatus.PAYMENT_UNDER_REVIEW,
                uz.university.uems.entity.BookingStatus.PAYMENT_REJECTED
            ) AND (a.paymentDeadline IS NULL OR a.paymentDeadline > :now))
          )
    """)
    List<HallApplication> findOverlappingActiveBookings(
            @Param("hallId") Long hallId,
            @Param("eventDate") LocalDate eventDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId,
            @Param("now") Instant now);

    @Query("""
        SELECT a FROM HallApplication a
        JOIN FETCH a.applicant
        JOIN FETCH a.hall
        WHERE a.status IN (
            uz.university.uems.entity.BookingStatus.PAYMENT_PENDING,
            uz.university.uems.entity.BookingStatus.PAYMENT_REJECTED
        )
        AND a.paymentDeadline IS NOT NULL
        AND a.paymentDeadline <= :now
    """)
    List<HallApplication> findExpiredReservations(@Param("now") Instant now);

    @EntityGraph(attributePaths = {"hall", "applicant"})
    @Query("""
        SELECT a FROM HallApplication a
        WHERE a.eventDate >= :startDate
          AND a.eventDate <= :endDate
          AND (:hallId IS NULL OR a.hall.id = :hallId)
          AND a.status NOT IN (
              uz.university.uems.entity.BookingStatus.REJECTED,
              uz.university.uems.entity.BookingStatus.CANCELLED,
              uz.university.uems.entity.BookingStatus.EXPIRED
          )
        ORDER BY a.eventDate ASC, a.startTime ASC
    """)
    List<HallApplication> findCalendarBookings(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("hallId") Long hallId);
}
