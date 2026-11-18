package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.EquipmentDto;
import uz.university.uems.dto.EquipmentHistoryItemDto;
import uz.university.uems.dto.EquipmentRequestDto;
import uz.university.uems.dto.EquipmentReservationDto;
import uz.university.uems.entity.Equipment;
import uz.university.uems.entity.EquipmentRequestStatus;
import uz.university.uems.entity.EquipmentReservation;
import uz.university.uems.entity.User;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.EquipmentRepository;
import uz.university.uems.repository.EquipmentReservationRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentReservationRepository reservationRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<EquipmentDto> listAvailableEquipment(LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Equipment> list = equipmentRepository.findByActiveTrueOrderByNameAsc();
        Instant now = Instant.now();
        LocalDate today = LocalDate.now();
        return list.stream().map(eq -> {
            long reserved = (date != null && startTime != null && endTime != null && endTime.isAfter(startTime))
                    ? reservationRepository.sumReservedQuantityForWindow(eq.getId(), date, startTime, endTime, null, now)
                    : reservationRepository.sumUpcomingReservedQuantity(eq.getId(), today);
            return EquipmentDto.from(eq, reserved);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<EquipmentDto> listAllEquipmentAdmin() {
        LocalDate today = LocalDate.now();
        return equipmentRepository.findAllByOrderByNameAsc().stream()
                .map(eq -> EquipmentDto.from(eq, reservationRepository.sumUpcomingReservedQuantity(eq.getId(), today)))
                .toList();
    }

    @Transactional
    public EquipmentDto createEquipment(EquipmentRequestDto req) {
        String name = req.getName().trim();
        if (equipmentRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("Equipment '" + name + "' already exists.");
        }
        Equipment saved = equipmentRepository.save(Equipment.builder()
                .name(name)
                .category(req.getCategory().trim())
                .description(req.getDescription() != null && !req.getDescription().isBlank() ? req.getDescription().trim() : null)
                .totalQuantity(req.getTotalQuantity())
                .unitFee(req.getUnitFee())
                .active(req.isActive())
                .build());
        return EquipmentDto.from(saved, 0);
    }

    @Transactional
    public EquipmentDto updateEquipment(Long id, EquipmentRequestDto req) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        String name = req.getName().trim();
        if (equipmentRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new DuplicateResourceException("Equipment '" + name + "' already exists.");
        }
        long reserved = reservationRepository.sumUpcomingReservedQuantity(id, LocalDate.now());
        if (req.getTotalQuantity() < reserved) {
            throw new BadRequestException("Total quantity cannot be less than currently reserved upcoming units (" + reserved + ").");
        }
        eq.setName(name);
        eq.setCategory(req.getCategory().trim());
        eq.setDescription(req.getDescription() != null && !req.getDescription().isBlank() ? req.getDescription().trim() : null);
        eq.setTotalQuantity(req.getTotalQuantity());
        eq.setUnitFee(req.getUnitFee());
        eq.setActive(req.isActive());
        return EquipmentDto.from(equipmentRepository.save(eq), reserved);
    }

    @Transactional
    public EquipmentDto toggleStatus(Long id, boolean active) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        eq.setActive(active);
        long reserved = reservationRepository.sumUpcomingReservedQuantity(id, LocalDate.now());
        return EquipmentDto.from(equipmentRepository.save(eq), reserved);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        Equipment eq = equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found with id: " + id));
        if (reservationRepository.existsByEquipmentId(id)) {
            throw new BadRequestException("Cannot delete equipment with existing reservation history. Deactivate it instead.");
        }
        equipmentRepository.delete(eq);
    }

    @Transactional(readOnly = true)
    public List<EquipmentHistoryItemDto> getEquipmentHistory(Long id) {
        if (!equipmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Equipment not found with id: " + id);
        }
        return reservationRepository.findByEquipmentIdOrderByCreatedAtDesc(id)
                .stream()
                .map(EquipmentHistoryItemDto::from)
                .toList();
    }

    @Transactional
    public EquipmentReservationDto approveEquipmentRequest(Long appId, Long reservationId, User admin, String comment) {
        EquipmentReservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment reservation not found."));
        if (!res.getApplication().getId().equals(appId)) {
            throw new BadRequestException("Equipment reservation does not belong to this application.");
        }
        var app = res.getApplication();
        Equipment eq = equipmentRepository.findAllByIdInForUpdate(List.of(res.getEquipment().getId())).get(0);

        long alreadyReserved = reservationRepository.sumReservedQuantityForWindow(
                eq.getId(), app.getEventDate(), app.getStartTime(), app.getEndTime(), app.getId(), Instant.now());
        long remaining = eq.getTotalQuantity() - alreadyReserved;
        if (res.getQuantityRequested() > remaining) {
            throw new DuplicateResourceException("Not enough '" + eq.getName() + "' units available (" + Math.max(0, remaining) + " left for this time slot).");
        }

        res.setStatus(EquipmentRequestStatus.APPROVED);
        res.setAdminComment(comment != null && !comment.isBlank() ? comment.trim() : "Approved by " + admin.getUsername());
        EquipmentReservation saved = reservationRepository.save(res);

        notificationService.notifyUser(
                app.getApplicant(),
                "Equipment Approved (" + app.getApplicationCode() + ")",
                res.getQuantityRequested() + "x " + eq.getName() + " approved for '" + app.getEventName() + "'.",
                "SUCCESS",
                app
        );
        return EquipmentReservationDto.from(saved);
    }

    @Transactional
    public EquipmentReservationDto rejectEquipmentRequest(Long appId, Long reservationId, User admin, String reason) {
        EquipmentReservation res = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment reservation not found."));
        if (!res.getApplication().getId().equals(appId)) {
            throw new BadRequestException("Equipment reservation does not belong to this application.");
        }
        var app = res.getApplication();
        res.setStatus(EquipmentRequestStatus.REJECTED);
        res.setAdminComment(reason.trim());
        EquipmentReservation saved = reservationRepository.save(res);

        notificationService.notifyUser(
                app.getApplicant(),
                "Equipment Request Rejected (" + app.getApplicationCode() + ")",
                res.getQuantityRequested() + "x " + res.getEquipment().getName() + " rejected: " + reason.trim(),
                "WARNING",
                app
        );
        return EquipmentReservationDto.from(saved);
    }
}
