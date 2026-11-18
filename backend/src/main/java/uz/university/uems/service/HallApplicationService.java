package uz.university.uems.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.*;
import uz.university.uems.entity.*;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HallApplicationService {

    private static final String CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_COMPACT = DateTimeFormatter.BASIC_ISO_DATE;

    private final HallApplicationRepository applicationRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final EventHallRepository hallRepository;
    private final HallScheduleBlockRepository scheduleBlockRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentReservationRepository equipmentReservationRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final FinancialAuditLogRepository financialAuditLogRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final BookingPdfService bookingPdfService;

    @Value("${app.payment.bank-card-number:8600 1204 8899 4421}")
    private String bankCardNumber;

    @Value("${app.payment.bank-card-holder:NATIONAL UNIVERSITY TREASURY}")
    private String bankCardHolder;

    @Value("${app.payment.bank-name:Kapitalbank (University Treasury Account)}")
    private String bankName;

    @Value("${app.booking.reservation-hours:24}")
    private long reservationHours;

    @Transactional(readOnly = true)
    public List<EventHallDto> listActiveHalls() {
        return hallRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(EventHallDto::from)
                .toList();
    }

    @Transactional
    public HallApplicationDto submitApplication(Long userId, CreateHallApplicationRequest request) {
        User applicant = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));

        validateDateTimeWindow(request.getEventDate(), request.getStartTime(), request.getEndTime());

        EventHall hall = hallRepository.findByIdForUpdate(request.getHallId())
                .orElseThrow(() -> new ResourceNotFoundException("Selected event hall not found."));

        if (!hall.isActive()) {
            throw new BadRequestException("The selected event hall is currently unavailable for booking.");
        }
        if (request.getExpectedParticipants() > hall.getCapacity()) {
            throw new BadRequestException(
                    "Expected participants (" + request.getExpectedParticipants()
                            + ") exceeds " + hall.getName() + " capacity (" + hall.getCapacity() + ")."
            );
        }

        Instant now = Instant.now();
        checkHallConflicts(hall, request.getEventDate(), request.getStartTime(), request.getEndTime(), null, now);

        // Validate & lock requested equipment items (deadlock-free sorted ID locking)
        Map<Long, Integer> requestedEquipmentMap = new LinkedHashMap<>();
        if (request.getEquipmentItems() != null) {
            for (EquipmentItemRequest item : request.getEquipmentItems()) {
                if (item.getQuantity() != null && item.getQuantity() > 0) {
                    requestedEquipmentMap.merge(item.getEquipmentId(), item.getQuantity(), Integer::sum);
                }
            }
        }

        List<Equipment> lockedEquipment = List.of();
        Map<Long, Equipment> equipmentById = new HashMap<>();
        BigDecimal equipmentFee = BigDecimal.ZERO;

        if (!requestedEquipmentMap.isEmpty()) {
            List<Long> sortedIds = requestedEquipmentMap.keySet().stream().sorted().toList();
            lockedEquipment = equipmentRepository.findAllByIdInForUpdate(sortedIds);
            for (Equipment eq : lockedEquipment) {
                equipmentById.put(eq.getId(), eq);
            }
            for (Map.Entry<Long, Integer> entry : requestedEquipmentMap.entrySet()) {
                Equipment eq = equipmentById.get(entry.getKey());
                if (eq == null) {
                    throw new ResourceNotFoundException("Equipment not found with id: " + entry.getKey());
                }
                if (!eq.isActive()) {
                    throw new BadRequestException("Equipment '" + eq.getName() + "' is currently unavailable.");
                }
                long reserved = equipmentReservationRepository.sumReservedQuantityForWindow(
                        eq.getId(), request.getEventDate(), request.getStartTime(), request.getEndTime(), null, now);
                long available = eq.getTotalQuantity() - reserved;
                if (entry.getValue() > available) {
                    throw new DuplicateResourceException(
                            "Insufficient '" + eq.getName() + "' quantity for this time slot (requested: "
                                    + entry.getValue() + ", available: " + Math.max(0, available) + ")."
                    );
                }
                equipmentFee = equipmentFee.add(eq.getUnitFee().multiply(BigDecimal.valueOf(entry.getValue())));
            }
        }

        BigDecimal hallFee = calculateFee(hall.getHourlyRate(), request.getStartTime(), request.getEndTime());
        BigDecimal totalFee = hallFee.add(equipmentFee).setScale(2, RoundingMode.HALF_UP);
        String code = generateUniqueCode(request.getEventDate());

        HallApplication app = HallApplication.builder()
                .applicationCode(code)
                .applicant(applicant)
                .applicantFirstName(applicant.getFirstName())
                .applicantLastName(applicant.getLastName())
                .applicantPhoneNumber(applicant.getPhoneNumber())
                .hall(hall)
                .eventName(request.getEventName().trim())
                .eventType(request.getEventType().trim())
                .eventDate(request.getEventDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .expectedParticipants(request.getExpectedParticipants())
                .description(request.getDescription() != null && !request.getDescription().isBlank()
                        ? request.getDescription().trim()
                        : null)
                .status(BookingStatus.PENDING)
                .requiredAmount(totalFee)
                .build();

        HallApplication saved = applicationRepository.save(app);

        for (Map.Entry<Long, Integer> entry : requestedEquipmentMap.entrySet()) {
            equipmentReservationRepository.save(EquipmentReservation.builder()
                    .application(saved)
                    .equipment(equipmentById.get(entry.getKey()))
                    .quantityRequested(entry.getValue())
                    .status(EquipmentRequestStatus.PENDING)
                    .build());
        }

        recordHistory(saved, applicant.getUsername(), fullName(applicant), "USER",
                "SUBMITTED", null, BookingStatus.PENDING,
                "Application submitted for " + hall.getName() + " on " + request.getEventDate()
                        + (requestedEquipmentMap.isEmpty() ? "" : " with " + requestedEquipmentMap.size() + " equipment item(s)"));

        notificationService.notifyUser(
                applicant,
                "Application Submitted (" + saved.getApplicationCode() + ")",
                "Your hall booking application for '" + saved.getEventName() + "' has been submitted and is pending admin review.",
                "INFO",
                saved
        );

        notificationService.notifyAdmins(
                "New Hall Application: " + saved.getApplicationCode(),
                fullName(applicant) + " requested " + hall.getName() + " for '" + saved.getEventName()
                        + "' on " + saved.getEventDate() + " (" + saved.getStartTime() + "–" + saved.getEndTime() + ").",
                "INFO",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public List<HallApplicationDto> getMyApplications(Long userId) {
        List<HallApplication> list = applicationRepository.findByApplicantIdOrderByCreatedAtDesc(userId);
        list.forEach(this::expireIfOverdue);
        return list.stream().map(this::toDtoWithHistory).toList();
    }

    @Transactional
    public HallApplicationDto getApplicationDetails(Long appId, Long requesterId, boolean isAdmin) {
        HallApplication app = findWithDetails(appId);
        if (!isAdmin && !app.getApplicant().getId().equals(requesterId)) {
            throw new ForbiddenOperationException("You do not have permission to view this application.");
        }
        expireIfOverdue(app);
        return toDtoWithHistory(app);
    }

    @Transactional
    public HallApplicationDto replyToInfoRequest(Long appId, Long userId, UserInfoReplyRequest request) {
        HallApplication app = findWithDetails(appId);
        if (!app.getApplicant().getId().equals(userId)) {
            throw new ForbiddenOperationException("You do not have permission to update this application.");
        }
        if (app.getStatus() != BookingStatus.UNDER_REVIEW) {
            throw new BadRequestException("Additional information can only be submitted when an application is UNDER_REVIEW.");
        }

        BookingStatus prev = app.getStatus();
        app.setUserReply(request.getReply().trim());
        app.setStatus(BookingStatus.PENDING);
        HallApplication saved = applicationRepository.save(app);

        User applicant = saved.getApplicant();
        recordHistory(saved, applicant.getUsername(), fullName(applicant), "USER",
                "USER_RESPONDED", prev, BookingStatus.PENDING, request.getReply().trim());

        notificationService.notifyAdmins(
                "Additional Info Provided (" + saved.getApplicationCode() + ")",
                fullName(applicant) + " replied to your information request for '" + saved.getEventName() + "'.",
                "INFO",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public HallApplicationDto uploadReceipt(Long appId, Long userId, MultipartFile file) {
        HallApplication app = findWithDetails(appId);
        if (!app.getApplicant().getId().equals(userId)) {
            throw new ForbiddenOperationException("You do not have permission to upload a receipt for this application.");
        }

        expireIfOverdue(app);

        if (app.getStatus() == BookingStatus.EXPIRED) {
            throw new BadRequestException("This reservation has expired because the 24-hour payment deadline passed.");
        }
        if (app.getStatus() != BookingStatus.PAYMENT_PENDING && app.getStatus() != BookingStatus.PAYMENT_REJECTED) {
            throw new BadRequestException("Payment receipts can only be uploaded when payment is pending or re-requested.");
        }

        String oldFilename = app.getReceiptFilename();
        String storedFilename = fileStorageService.storeReceipt(file);

        BookingStatus prev = app.getStatus();
        app.setReceiptFilename(storedFilename);
        app.setReceiptUploadedAt(Instant.now());
        app.setStatus(BookingStatus.PAYMENT_UNDER_REVIEW);
        app.setPaymentStatus(BookingStatus.PAYMENT_UNDER_REVIEW);
        HallApplication saved = applicationRepository.save(app);

        if (oldFilename != null && !oldFilename.equals(storedFilename)) {
            fileStorageService.deleteReceipt(oldFilename);
        }

        User applicant = saved.getApplicant();
        recordHistory(saved, applicant.getUsername(), fullName(applicant), "USER",
                "RECEIPT_UPLOADED", prev, BookingStatus.PAYMENT_UNDER_REVIEW,
                "Payment receipt uploaded for bank transaction verification.");

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(saved.getId())
                .applicationCode(saved.getApplicationCode())
                .actorUsername(applicant.getUsername())
                .actorRole("USER")
                .actionType("RECEIPT_UPLOADED")
                .amount(saved.getRequiredAmount())
                .details("User uploaded payment receipt (" + storedFilename + ").")
                .build());

        notificationService.notifyUser(
                applicant,
                "Payment Received for Verification",
                "Your payment receipt for " + saved.getApplicationCode() + " has been received and is now under review by administration.",
                "INFO",
                saved
        );

        notificationService.notifyAdmins(
                "Payment Receipt Uploaded (" + saved.getApplicationCode() + ")",
                fullName(applicant) + " uploaded a payment receipt ($" + saved.getRequiredAmount() + ") for '" + saved.getEventName() + "'.",
                "WARNING",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public HallApplicationDto cancelApplication(Long appId, Long userId) {
        HallApplication app = findWithDetails(appId);
        if (!app.getApplicant().getId().equals(userId)) {
            throw new ForbiddenOperationException("You do not have permission to cancel this application.");
        }
        if (app.getStatus() == BookingStatus.REJECTED
                || app.getStatus() == BookingStatus.EXPIRED
                || app.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("This application is already closed (" + app.getStatus() + ").");
        }
        if (app.getPaymentStatus() == BookingStatus.PAYMENT_APPROVED || app.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Confirmed/paid bookings require a formal cancellation & refund request.");
        }

        BookingStatus prev = app.getStatus();
        app.setStatus(BookingStatus.CANCELLED);
        HallApplication saved = applicationRepository.save(app);
        releaseEquipment(saved.getId());

        User applicant = saved.getApplicant();
        recordHistory(saved, applicant.getUsername(), fullName(applicant), "USER",
                "CANCELLED", prev, BookingStatus.CANCELLED, "Cancelled by applicant.");

        return toDtoWithHistory(saved);
    }

    @Transactional(readOnly = true)
    public byte[] generateConfirmationPdf(Long appId, Long requesterId, boolean isAdmin) {
        HallApplication app = findWithDetails(appId);
        if (!isAdmin && !app.getApplicant().getId().equals(requesterId)) {
            throw new ForbiddenOperationException("You do not have permission to download this confirmation.");
        }
        if (app.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("PDF confirmation is only available once the booking is CONFIRMED.");
        }
        return bookingPdfService.generateConfirmationPdf(app);
    }

    @Transactional(readOnly = true)
    public boolean canAccessReceipt(String filename, Long requesterId, boolean isAdmin) {
        if (isAdmin) return true;
        return applicationRepository.findAll((root, query, cb) ->
                        cb.and(
                                cb.equal(root.get("receiptFilename"), filename),
                                cb.equal(root.get("applicant").get("id"), requesterId)
                        ))
                .stream()
                .findFirst()
                .isPresent();
    }

    // ---------------- ADMIN OPERATIONS ----------------

    @Transactional
    public ApplicationStatsDto getApplicationStats() {
        expireOverdueReservations();
        return ApplicationStatsDto.builder()
                .totalApplications(applicationRepository.count())
                .pendingCount(applicationRepository.countByStatus(BookingStatus.PENDING))
                .underReviewCount(applicationRepository.countByStatus(BookingStatus.UNDER_REVIEW))
                .paymentPendingCount(applicationRepository.countByStatus(BookingStatus.PAYMENT_PENDING))
                .paymentUnderReviewCount(applicationRepository.countByStatus(BookingStatus.PAYMENT_UNDER_REVIEW))
                .confirmedCount(applicationRepository.countByStatus(BookingStatus.CONFIRMED))
                .rejectedCount(applicationRepository.countByStatus(BookingStatus.REJECTED))
                .expiredCount(applicationRepository.countByStatus(BookingStatus.EXPIRED))
                .cancelledCount(applicationRepository.countByStatus(BookingStatus.CANCELLED))
                .build();
    }

    @Transactional
    public PagedResponse<HallApplicationDto> listAllApplications(
            String search,
            BookingStatus status,
            Long hallId,
            String eventType,
            LocalDate eventDate,
            int page,
            int size) {

        expireOverdueReservations();

        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<HallApplication> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("applicationCode")), pattern),
                        cb.like(cb.lower(root.get("eventName")), pattern),
                        cb.like(cb.lower(root.get("applicantFirstName")), pattern),
                        cb.like(cb.lower(root.get("applicantLastName")), pattern),
                        cb.like(cb.lower(root.get("applicantPhoneNumber")), pattern),
                        cb.like(cb.lower(root.get("applicant").get("username")), pattern)
                ));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (hallId != null) {
                predicates.add(cb.equal(root.get("hall").get("id"), hallId));
            }
            if (eventType != null && !eventType.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("eventType")), eventType.trim().toLowerCase()));
            }
            if (eventDate != null) {
                predicates.add(cb.equal(root.get("eventDate"), eventDate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return PagedResponse.from(
                applicationRepository.findAll(spec, pageable).map(this::toDtoWithHistory)
        );
    }

    @Transactional
    public HallApplicationDto approveApplication(Long appId, User admin, String comment) {
        HallApplication app = findWithDetails(appId);
        if (app.getStatus() != BookingStatus.PENDING && app.getStatus() != BookingStatus.UNDER_REVIEW) {
            throw new BadRequestException("Only PENDING or UNDER_REVIEW applications can be approved.");
        }

        EventHall hall = hallRepository.findByIdForUpdate(app.getHall().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event hall not found."));

        Instant now = Instant.now();
        checkHallConflicts(hall, app.getEventDate(), app.getStartTime(), app.getEndTime(), app.getId(), now);

        BigDecimal hallFee = calculateFee(hall.getHourlyRate(), app.getStartTime(), app.getEndTime());
        BigDecimal eqFee = calculateApprovedOrPendingEquipmentFee(app.getId());
        BigDecimal totalAmount = hallFee.add(eqFee).setScale(2, RoundingMode.HALF_UP);
        Instant deadline = now.plus(reservationHours, ChronoUnit.HOURS);

        BookingStatus prev = app.getStatus();
        app.setStatus(BookingStatus.PAYMENT_PENDING);
        app.setPaymentStatus(BookingStatus.PAYMENT_PENDING);
        app.setRequiredAmount(totalAmount);
        app.setBankCardNumber(bankCardNumber);
        app.setBankCardHolder(bankCardHolder);
        app.setBankName(bankName);
        app.setApprovedAt(now);
        app.setPaymentDeadline(deadline);
        app.setAdminComment(comment != null && !comment.isBlank()
                ? comment.trim()
                : "Application approved. Please complete payment within 24 hours.");

        HallApplication saved = applicationRepository.save(app);

        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "APPROVED", prev, BookingStatus.APPROVED, app.getAdminComment());
        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "TEMPORARY_HOLD_CREATED", BookingStatus.APPROVED, BookingStatus.PAYMENT_PENDING,
                "Hall temporarily reserved for " + reservationHours + " hours. Required payment: $" + totalAmount);

        notificationService.notifyUser(
                saved.getApplicant(),
                "Application Approved — Payment Required (" + saved.getApplicationCode() + ")",
                "Your booking for '" + saved.getEventName() + "' in " + hall.getName()
                        + " is approved! The hall is reserved for 24 hours. Please pay $" + totalAmount
                        + " to card " + bankCardNumber + " and upload your receipt.",
                "SUCCESS",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public HallApplicationDto rejectApplication(Long appId, User admin, String reason) {
        HallApplication app = findWithDetails(appId);
        if (app.getStatus() != BookingStatus.PENDING && app.getStatus() != BookingStatus.UNDER_REVIEW) {
            throw new BadRequestException("Only PENDING or UNDER_REVIEW applications can be rejected.");
        }

        BookingStatus prev = app.getStatus();
        app.setStatus(BookingStatus.REJECTED);
        app.setAdminComment(reason.trim());
        HallApplication saved = applicationRepository.save(app);
        releaseEquipment(saved.getId());

        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "REJECTED", prev, BookingStatus.REJECTED, reason.trim());

        notificationService.notifyUser(
                saved.getApplicant(),
                "Application Rejected (" + saved.getApplicationCode() + ")",
                "Your hall booking application for '" + saved.getEventName() + "' was rejected. Reason: " + reason.trim(),
                "ERROR",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public HallApplicationDto requestAdditionalInfo(Long appId, User admin, String message) {
        HallApplication app = findWithDetails(appId);
        if (app.getStatus() != BookingStatus.PENDING && app.getStatus() != BookingStatus.UNDER_REVIEW) {
            throw new BadRequestException("Additional information can only be requested for PENDING or UNDER_REVIEW applications.");
        }

        BookingStatus prev = app.getStatus();
        app.setStatus(BookingStatus.UNDER_REVIEW);
        app.setAdminComment(message.trim());
        HallApplication saved = applicationRepository.save(app);

        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "INFO_REQUESTED", prev, BookingStatus.UNDER_REVIEW, message.trim());

        notificationService.notifyUser(
                saved.getApplicant(),
                "Additional Information Requested (" + saved.getApplicationCode() + ")",
                "Administrator requested more details for '" + saved.getEventName() + "': " + message.trim(),
                "WARNING",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public HallApplicationDto approvePayment(Long appId, User admin, String comment) {
        HallApplication app = findWithDetails(appId);
        if (app.getStatus() != BookingStatus.PAYMENT_UNDER_REVIEW) {
            throw new BadRequestException("Payment can only be verified when status is PAYMENT_UNDER_REVIEW.");
        }

        EventHall hall = hallRepository.findByIdForUpdate(app.getHall().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event hall not found."));

        Instant now = Instant.now();
        checkHallConflicts(hall, app.getEventDate(), app.getStartTime(), app.getEndTime(), app.getId(), now);

        BookingStatus prev = app.getStatus();
        app.setPaymentStatus(BookingStatus.PAYMENT_APPROVED);
        app.setStatus(BookingStatus.CONFIRMED);
        app.setPaymentVerifiedAt(now);
        app.setConfirmedAt(now);
        app.setVerifiedByAdmin(fullName(admin) + " (@" + admin.getUsername() + ")");
        if (comment != null && !comment.isBlank()) {
            app.setAdminComment(comment.trim());
        }

        HallApplication saved = applicationRepository.save(app);

        String note = comment != null && !comment.isBlank()
                ? comment.trim()
                : "Bank transaction verified and booking confirmed.";

        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "PAYMENT_APPROVED", prev, BookingStatus.PAYMENT_APPROVED, note);
        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "BOOKING_CONFIRMED", BookingStatus.PAYMENT_APPROVED, BookingStatus.CONFIRMED,
                "Booking confirmed for " + hall.getName() + " on " + saved.getEventDate() + ".");

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(saved.getId())
                .applicationCode(saved.getApplicationCode())
                .actorUsername(admin.getUsername())
                .actorRole("ADMIN")
                .actionType("PAYMENT_APPROVED")
                .amount(saved.getRequiredAmount())
                .details(note)
                .build());

        notificationService.notifyUser(
                saved.getApplicant(),
                "Booking Confirmed! (" + saved.getApplicationCode() + ")",
                "Your payment of $" + saved.getRequiredAmount() + " has been verified! Your booking for '"
                        + saved.getEventName() + "' in " + hall.getName() + " on " + saved.getEventDate()
                        + " (" + saved.getStartTime() + "–" + saved.getEndTime() + ") is CONFIRMED. You can now download your PDF confirmation.",
                "SUCCESS",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public HallApplicationDto rejectPayment(Long appId, User admin, String reason) {
        HallApplication app = findWithDetails(appId);
        if (app.getStatus() != BookingStatus.PAYMENT_UNDER_REVIEW) {
            throw new BadRequestException("Payment can only be rejected when status is PAYMENT_UNDER_REVIEW.");
        }

        BookingStatus prev = app.getStatus();
        app.setPaymentStatus(BookingStatus.PAYMENT_REJECTED);
        app.setStatus(BookingStatus.PAYMENT_REJECTED);
        app.setAdminComment(reason.trim());
        HallApplication saved = applicationRepository.save(app);

        recordHistory(saved, admin.getUsername(), fullName(admin), "ADMIN",
                "PAYMENT_REJECTED", prev, BookingStatus.PAYMENT_REJECTED, reason.trim());

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(saved.getId())
                .applicationCode(saved.getApplicationCode())
                .actorUsername(admin.getUsername())
                .actorRole("ADMIN")
                .actionType("PAYMENT_REJECTED")
                .amount(saved.getRequiredAmount())
                .details("Payment rejected: " + reason.trim())
                .build());

        notificationService.notifyUser(
                saved.getApplicant(),
                "Payment Verification Failed (" + saved.getApplicationCode() + ")",
                "Your uploaded receipt for '" + saved.getEventName() + "' could not be verified: "
                        + reason.trim() + ". Please upload a valid receipt before the reservation deadline.",
                "ERROR",
                saved
        );

        return toDtoWithHistory(saved);
    }

    @Transactional
    public int expireOverdueReservations() {
        Instant now = Instant.now();
        List<HallApplication> overdue = applicationRepository.findExpiredReservations(now);
        for (HallApplication app : overdue) {
            expireApp(app);
        }
        return overdue.size();
    }

    private void expireIfOverdue(HallApplication app) {
        if ((app.getStatus() == BookingStatus.PAYMENT_PENDING || app.getStatus() == BookingStatus.PAYMENT_REJECTED)
                && app.getPaymentDeadline() != null
                && !app.getPaymentDeadline().isAfter(Instant.now())) {
            expireApp(app);
        }
    }

    private void expireApp(HallApplication app) {
        BookingStatus prev = app.getStatus();
        app.setStatus(BookingStatus.EXPIRED);
        HallApplication saved = applicationRepository.save(app);
        releaseEquipment(saved.getId());

        recordHistory(saved, "system", "Automated Reservation Monitor", "SYSTEM",
                "EXPIRED", prev, BookingStatus.EXPIRED,
                "24-hour temporary reservation expired because payment was not completed in time.");

        notificationService.notifyUser(
                saved.getApplicant(),
                "Reservation Expired (" + saved.getApplicationCode() + ")",
                "Your 24-hour reservation for '" + saved.getEventName() + "' in " + saved.getHall().getName()
                        + " has expired due to unpaid deadline.",
                "ERROR",
                saved
        );
    }

    private void checkHallConflicts(
            EventHall hall,
            LocalDate eventDate,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeAppId,
            Instant now) {
        List<HallApplication> overlaps = applicationRepository.findOverlappingActiveBookings(
                hall.getId(), eventDate, startTime, endTime, excludeAppId, now);
        if (!overlaps.isEmpty()) {
            HallApplication conflict = overlaps.get(0);
            throw new DuplicateResourceException(
                    "Hall '" + hall.getName() + "' is already reserved or confirmed on "
                            + eventDate + " from " + conflict.getStartTime() + " to " + conflict.getEndTime() + "."
            );
        }
        List<HallScheduleBlock> blocks = scheduleBlockRepository.findOverlappingBlocks(
                hall.getId(), eventDate, startTime, endTime);
        if (!blocks.isEmpty()) {
            HallScheduleBlock block = blocks.get(0);
            throw new DuplicateResourceException(
                    "Hall '" + hall.getName() + "' is unavailable on " + eventDate + " from "
                            + block.getStartTime() + " to " + block.getEndTime() + " (" + block.getReason() + ")."
            );
        }
    }

    private void releaseEquipment(Long appId) {
        List<EquipmentReservation> items = equipmentReservationRepository.findByApplicationIdOrderByIdAsc(appId);
        for (EquipmentReservation item : items) {
            if (item.getStatus() == EquipmentRequestStatus.PENDING || item.getStatus() == EquipmentRequestStatus.APPROVED) {
                item.setStatus(EquipmentRequestStatus.RELEASED);
                equipmentReservationRepository.save(item);
            }
        }
    }

    private BigDecimal calculateApprovedOrPendingEquipmentFee(Long appId) {
        return equipmentReservationRepository.findByApplicationIdOrderByIdAsc(appId).stream()
                .filter(r -> r.getStatus() == EquipmentRequestStatus.PENDING || r.getStatus() == EquipmentRequestStatus.APPROVED)
                .map(r -> r.getEquipment().getUnitFee().multiply(BigDecimal.valueOf(r.getQuantityRequested())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private HallApplication findWithDetails(Long appId) {
        return applicationRepository.findWithDetailsById(appId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + appId));
    }

    private HallApplicationDto toDtoWithHistory(HallApplication app) {
        List<ApplicationHistoryDto> history = historyRepository
                .findByApplicationIdOrderByCreatedAtDesc(app.getId())
                .stream()
                .map(ApplicationHistoryDto::from)
                .toList();
        List<EquipmentReservationDto> eqList = equipmentReservationRepository
                .findByApplicationIdOrderByIdAsc(app.getId())
                .stream()
                .map(EquipmentReservationDto::from)
                .toList();
        CancellationRequestDto cancelDto = cancellationRequestRepository
                .findByApplicationId(app.getId())
                .map(CancellationRequestDto::from)
                .orElse(null);

        return HallApplicationDto.from(app, history, eqList, cancelDto);
    }

    private void recordHistory(
            HallApplication app,
            String actorUsername,
            String actorFullName,
            String actorRole,
            String action,
            BookingStatus prev,
            BookingStatus next,
            String comment) {
        historyRepository.save(ApplicationHistory.builder()
                .application(app)
                .actorUsername(actorUsername)
                .actorFullName(actorFullName)
                .actorRole(actorRole)
                .action(action)
                .previousStatus(prev)
                .newStatus(next)
                .comment(comment)
                .build());
    }

    private void validateDateTimeWindow(LocalDate date, LocalTime start, LocalTime end) {
        if (!end.isAfter(start)) {
            throw new BadRequestException("End time must be strictly after start time.");
        }
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes < 30) {
            throw new BadRequestException("Event duration must be at least 30 minutes.");
        }
        if (date.equals(LocalDate.now()) && start.isBefore(LocalTime.now())) {
            throw new BadRequestException("Start time for today's date cannot be in the past.");
        }
    }

    private BigDecimal calculateFee(BigDecimal hourlyRate, LocalTime start, LocalTime end) {
        long minutes = Duration.between(start, end).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(Math.max(minutes, 60L))
                .divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        return hourlyRate.multiply(hours).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateUniqueCode(LocalDate eventDate) {
        String prefix = "APP-" + DATE_COMPACT.format(eventDate) + "-";
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder(prefix);
            for (int i = 0; i < 4; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String candidate = sb.toString();
            if (!applicationRepository.existsByApplicationCode(candidate)) {
                return candidate;
            }
        }
        return prefix + System.currentTimeMillis() % 100000;
    }

    private String fullName(User user) {
        return user.getFirstName() + " " + user.getLastName();
    }
}
