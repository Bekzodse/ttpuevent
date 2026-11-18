package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.*;
import uz.university.uems.entity.*;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.EventHallRepository;
import uz.university.uems.repository.HallApplicationRepository;
import uz.university.uems.repository.HallScheduleBlockRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final EventHallRepository hallRepository;
    private final HallApplicationRepository applicationRepository;
    private final HallScheduleBlockRepository scheduleBlockRepository;
    private final HallApplicationService applicationService;

    @Transactional
    public CalendarResponseDto getCalendar(LocalDate startDate, LocalDate endDate, Long hallId) {
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date must not be before start date.");
        }
        applicationService.expireOverdueReservations();

        List<EventHallDto> halls = hallRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(EventHallDto::from)
                .toList();

        List<HallApplication> bookings = applicationRepository.findCalendarBookings(startDate, endDate, hallId);
        List<HallScheduleBlock> blocks = scheduleBlockRepository.findBlocksInRange(startDate, endDate, hallId);

        List<CalendarEventDto> events = new ArrayList<>();
        for (HallApplication app : bookings) {
            String slotState = resolveSlotState(app.getStatus());
            events.add(CalendarEventDto.builder()
                    .id(app.getId())
                    .itemType("BOOKING")
                    .applicationCode(app.getApplicationCode())
                    .hallId(app.getHall().getId())
                    .hallName(app.getHall().getName())
                    .eventName(app.getEventName())
                    .eventType(app.getEventType())
                    .date(app.getEventDate())
                    .startTime(app.getStartTime())
                    .endTime(app.getEndTime())
                    .bookingStatus(app.getStatus())
                    .slotState(slotState)
                    .build());
        }

        List<HallScheduleBlockDto> blockDtos = blocks.stream()
                .map(HallScheduleBlockDto::from)
                .toList();

        for (HallScheduleBlock b : blocks) {
            events.add(CalendarEventDto.builder()
                    .id(b.getId())
                    .itemType("SCHEDULE_BLOCK")
                    .hallId(b.getHall().getId())
                    .hallName(b.getHall().getName())
                    .eventName(b.getBlockType() + ": " + b.getReason())
                    .eventType(b.getBlockType())
                    .date(b.getBlockDate())
                    .startTime(b.getStartTime())
                    .endTime(b.getEndTime())
                    .slotState("BLOCKED")
                    .reason(b.getReason())
                    .build());
        }

        return CalendarResponseDto.builder()
                .halls(halls)
                .events(events)
                .blocks(blockDtos)
                .build();
    }

    @Transactional
    public List<TimeSlotAvailabilityDto> getDailyAvailability(Long hallId, LocalDate date) {
        if (!hallRepository.existsById(hallId)) {
            throw new ResourceNotFoundException("Event hall not found.");
        }
        applicationService.expireOverdueReservations();

        List<HallApplication> bookings = applicationRepository.findCalendarBookings(date, date, hallId);
        List<HallScheduleBlock> blocks = scheduleBlockRepository.findBlocksInRange(date, date, hallId);

        List<TimeSlotAvailabilityDto> slots = new ArrayList<>();
        for (int hour = 8; hour < 21; hour++) {
            LocalTime start = LocalTime.of(hour, 0);
            LocalTime end = LocalTime.of(hour + 1, 0);

            String slotState = "AVAILABLE";
            String eventName = null;
            String code = null;

            for (HallScheduleBlock b : blocks) {
                if (b.getStartTime().isBefore(end) && b.getEndTime().isAfter(start)) {
                    slotState = "BLOCKED";
                    eventName = b.getReason();
                    break;
                }
            }

            for (HallApplication app : bookings) {
                if (app.getStartTime().isBefore(end) && app.getEndTime().isAfter(start)) {
                    String candidateState = resolveSlotState(app.getStatus());
                    // CONFIRMED takes visual priority over RESERVED/PENDING
                    if ("CONFIRMED".equals(candidateState)
                            || ("RESERVED".equals(candidateState) && !"CONFIRMED".equals(slotState))
                            || ("AVAILABLE".equals(slotState))) {
                        slotState = candidateState;
                        eventName = app.getEventName();
                        code = app.getApplicationCode();
                    }
                }
            }

            slots.add(TimeSlotAvailabilityDto.builder()
                    .startTime(start)
                    .endTime(end)
                    .slotState(slotState)
                    .eventName(eventName)
                    .bookingCode(code)
                    .build());
        }
        return slots;
    }

    @Transactional
    public HallScheduleBlockDto createScheduleBlock(CreateScheduleBlockRequest req, User admin) {
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new BadRequestException("End time must be after start time.");
        }

        EventHall hall = hallRepository.findByIdForUpdate(req.getHallId())
                .orElseThrow(() -> new ResourceNotFoundException("Event hall not found."));

        List<HallApplication> overlaps = applicationRepository.findOverlappingActiveBookings(
                hall.getId(), req.getBlockDate(), req.getStartTime(), req.getEndTime(), null, Instant.now());
        if (!overlaps.isEmpty()) {
            throw new DuplicateResourceException(
                    "Cannot block time slot: a confirmed or temporarily reserved booking already exists in this window ("
                            + overlaps.get(0).getApplicationCode() + ")."
            );
        }

        List<HallScheduleBlock> existingBlocks = scheduleBlockRepository.findOverlappingBlocks(
                hall.getId(), req.getBlockDate(), req.getStartTime(), req.getEndTime());
        if (!existingBlocks.isEmpty()) {
            throw new DuplicateResourceException("A schedule block already exists during this time slot.");
        }

        HallScheduleBlock saved = scheduleBlockRepository.save(HallScheduleBlock.builder()
                .hall(hall)
                .blockDate(req.getBlockDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .blockType(req.getBlockType().trim())
                .reason(req.getReason().trim())
                .createdBy(admin.getUsername())
                .build());

        return HallScheduleBlockDto.from(saved);
    }

    @Transactional
    public void deleteScheduleBlock(Long blockId) {
        if (!scheduleBlockRepository.existsById(blockId)) {
            throw new ResourceNotFoundException("Schedule block not found.");
        }
        scheduleBlockRepository.deleteById(blockId);
    }

    private String resolveSlotState(BookingStatus status) {
        if (status == BookingStatus.CONFIRMED) return "CONFIRMED";
        if (status == BookingStatus.APPROVED
                || status == BookingStatus.PAYMENT_PENDING
                || status == BookingStatus.PAYMENT_UNDER_REVIEW
                || status == BookingStatus.PAYMENT_REJECTED) {
            return "RESERVED";
        }
        return "PENDING";
    }
}
