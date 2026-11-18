package uz.university.uems.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.university.uems.entity.HallScheduleBlock;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface HallScheduleBlockRepository extends JpaRepository<HallScheduleBlock, Long> {

    @EntityGraph(attributePaths = {"hall"})
    @Query("""
        SELECT b FROM HallScheduleBlock b
        WHERE b.blockDate >= :startDate
          AND b.blockDate <= :endDate
          AND (:hallId IS NULL OR b.hall.id = :hallId)
        ORDER BY b.blockDate ASC, b.startTime ASC
    """)
    List<HallScheduleBlock> findBlocksInRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("hallId") Long hallId);

    @Query("""
        SELECT b FROM HallScheduleBlock b
        WHERE b.hall.id = :hallId
          AND b.blockDate = :blockDate
          AND b.startTime < :endTime
          AND b.endTime > :startTime
    """)
    List<HallScheduleBlock> findOverlappingBlocks(
            @Param("hallId") Long hallId,
            @Param("blockDate") LocalDate blockDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime);
}
