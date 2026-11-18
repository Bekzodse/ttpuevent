package uz.university.uems.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.university.uems.entity.EquipmentReservation;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

public interface EquipmentReservationRepository extends JpaRepository<EquipmentReservation, Long> {

    @EntityGraph(attributePaths = {"equipment"})
    List<EquipmentReservation> findByApplicationIdOrderByIdAsc(Long applicationId);

    @EntityGraph(attributePaths = {"equipment", "application", "application.hall", "application.applicant"})
    List<EquipmentReservation> findByEquipmentIdOrderByCreatedAtDesc(Long equipmentId);

    @Query("""
        SELECT COALESCE(SUM(r.quantityRequested), 0)
        FROM EquipmentReservation r
        JOIN r.application a
        WHERE r.equipment.id = :equipmentId
          AND (:excludeAppId IS NULL OR a.id <> :excludeAppId)
          AND r.status IN (
              uz.university.uems.entity.EquipmentRequestStatus.PENDING,
              uz.university.uems.entity.EquipmentRequestStatus.APPROVED
          )
          AND a.eventDate = :eventDate
          AND a.startTime < :endTime
          AND a.endTime > :startTime
          AND (
              a.status IN (
                  uz.university.uems.entity.BookingStatus.PENDING,
                  uz.university.uems.entity.BookingStatus.UNDER_REVIEW,
                  uz.university.uems.entity.BookingStatus.CONFIRMED
              )
              OR (a.status IN (
                  uz.university.uems.entity.BookingStatus.APPROVED,
                  uz.university.uems.entity.BookingStatus.PAYMENT_PENDING,
                  uz.university.uems.entity.BookingStatus.PAYMENT_UNDER_REVIEW,
                  uz.university.uems.entity.BookingStatus.PAYMENT_REJECTED
              ) AND (a.paymentDeadline IS NULL OR a.paymentDeadline > :now))
          )
    """)
    long sumReservedQuantityForWindow(
            @Param("equipmentId") Long equipmentId,
            @Param("eventDate") LocalDate eventDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeAppId") Long excludeAppId,
            @Param("now") Instant now);

    @Query("""
        SELECT COALESCE(SUM(r.quantityRequested), 0)
        FROM EquipmentReservation r
        JOIN r.application a
        WHERE r.equipment.id = :equipmentId
          AND r.status IN (
              uz.university.uems.entity.EquipmentRequestStatus.PENDING,
              uz.university.uems.entity.EquipmentRequestStatus.APPROVED
          )
          AND a.eventDate >= :today
          AND a.status IN (
              uz.university.uems.entity.BookingStatus.PENDING,
              uz.university.uems.entity.BookingStatus.UNDER_REVIEW,
              uz.university.uems.entity.BookingStatus.APPROVED,
              uz.university.uems.entity.BookingStatus.PAYMENT_PENDING,
              uz.university.uems.entity.BookingStatus.PAYMENT_UNDER_REVIEW,
              uz.university.uems.entity.BookingStatus.PAYMENT_REJECTED,
              uz.university.uems.entity.BookingStatus.CONFIRMED
          )
    """)
    long sumUpcomingReservedQuantity(
            @Param("equipmentId") Long equipmentId,
            @Param("today") LocalDate today);

    boolean existsByEquipmentId(Long equipmentId);

    @Modifying
    void deleteByApplicationIdIn(Collection<Long> applicationIds);
}
