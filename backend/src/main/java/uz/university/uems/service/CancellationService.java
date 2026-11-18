package uz.university.uems.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.*;
import uz.university.uems.entity.*;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CancellationService {

    private final CancellationRequestRepository cancellationRepository;
    private final CancellationPolicyRepository policyRepository;
    private final HallApplicationRepository applicationRepository;
    private final ApplicationHistoryRepository historyRepository;
    private final EquipmentReservationRepository equipmentReservationRepository;
    private final FinancialAuditLogRepository financialAuditLogRepository;
    private final NotificationService notificationService;

    @Transactional
    public CancellationPolicyDto getActivePolicy() {
        return CancellationPolicyDto.from(getOrCreatePolicyEntity());
    }

    @Transactional
    public CancellationPolicyDto updatePolicy(UpdateCancellationPolicyRequest req) {
        if (req.getPartialRefundHoursBefore() > req.getFullRefundHoursBefore()) {
            throw new BadRequestException("Partial refund hours cannot exceed full refund hours threshold.");
        }
        CancellationPolicy policy = getOrCreatePolicyEntity();
        policy.setName(req.getName().trim());
        policy.setFullRefundHoursBefore(req.getFullRefundHoursBefore());
        policy.setPartialRefundHoursBefore(req.getPartialRefundHoursBefore());
        policy.setPartialRefundPercent(req.getPartialRefundPercent());
        policy.setReleaseHallOnApproval(req.isReleaseHallOnApproval());
        policy.setDescription(req.getDescription() != null && !req.getDescription().isBlank() ? req.getDescription().trim() : null);
        return CancellationPolicyDto.from(policyRepository.save(policy));
    }

    @Transactional
    public CancellationRequestDto requestCancellation(Long appId, Long userId, CreateCancellationRequest req) {
        HallApplication app = applicationRepository.findWithDetailsById(appId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found."));

        if (!app.getApplicant().getId().equals(userId)) {
            throw new ForbiddenOperationException("You can only request cancellation for your own bookings.");
        }
        if (app.getStatus() == BookingStatus.CANCELLED
                || app.getStatus() == BookingStatus.REJECTED
                || app.getStatus() == BookingStatus.EXPIRED) {
            throw new BadRequestException("This booking is already closed (" + app.getStatus() + ").");
        }
        if (cancellationRepository.existsByApplicationId(appId)) {
            throw new DuplicateResourceException("A cancellation request has already been submitted for this booking.");
        }

        CancellationPolicy policy = getOrCreatePolicyEntity();
        BigDecimal paidAmount = app.getPaymentStatus() == BookingStatus.PAYMENT_APPROVED && app.getRequiredAmount() != null
                ? app.getRequiredAmount()
                : BigDecimal.ZERO;

        int eligiblePercent = calculateRefundPercent(app, policy);
        BigDecimal eligibleAmount = paidAmount
                .multiply(BigDecimal.valueOf(eligiblePercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        RefundStatus initialRefundStatus = paidAmount.compareTo(BigDecimal.ZERO) > 0
                ? RefundStatus.PENDING_VERIFICATION
                : RefundStatus.NOT_APPLICABLE;

        CancellationRequest saved = cancellationRepository.save(CancellationRequest.builder()
                .application(app)
                .requestedBy(app.getApplicant())
                .reason(req.getReason().trim())
                .status(CancellationStatus.PENDING)
                .refundStatus(initialRefundStatus)
                .paidAmount(paidAmount)
                .eligibleRefundPercent(eligiblePercent)
                .eligibleRefundAmount(eligibleAmount)
                .build());

        User applicant = app.getApplicant();
        historyRepository.save(ApplicationHistory.builder()
                .application(app)
                .actorUsername(applicant.getUsername())
                .actorFullName(applicant.getFirstName() + " " + applicant.getLastName())
                .actorRole("USER")
                .action("CANCELLATION_REQUESTED")
                .previousStatus(app.getStatus())
                .newStatus(app.getStatus())
                .comment("Reason: " + req.getReason().trim() + (paidAmount.compareTo(BigDecimal.ZERO) > 0
                        ? " | Policy eligible refund: " + eligiblePercent + "% ($" + eligibleAmount + ")" : ""))
                .build());

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .cancellationRequestId(saved.getId())
                .actorUsername(applicant.getUsername())
                .actorRole("USER")
                .actionType("CANCELLATION_REQUESTED")
                .amount(eligibleAmount)
                .details("Cancellation requested (" + eligiblePercent + "% eligible refund). Reason: " + req.getReason().trim())
                .build());

        notificationService.notifyUser(
                applicant,
                "Cancellation Request Submitted (" + app.getApplicationCode() + ")",
                "Your cancellation request for '" + app.getEventName() + "' has been submitted for administrator review.",
                "INFO",
                app
        );
        notificationService.notifyAdmins(
                "Cancellation Request: " + app.getApplicationCode(),
                applicant.getFirstName() + " " + applicant.getLastName() + " requested cancellation for '"
                        + app.getEventName() + "'. Eligible refund: $" + eligibleAmount,
                "WARNING",
                app
        );

        return CancellationRequestDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CancellationRequestDto> getMyCancellations(Long userId) {
        return cancellationRepository.findByRequestedByIdOrderByRequestedAtDesc(userId)
                .stream()
                .map(CancellationRequestDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PagedResponse<CancellationRequestDto> listAllCancellations(
            CancellationStatus status,
            RefundStatus refundStatus,
            String search,
            int page,
            int size) {
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Direction.DESC, "requestedAt")
        );

        Specification<CancellationRequest> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (refundStatus != null) {
                predicates.add(cb.equal(root.get("refundStatus"), refundStatus));
            }
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("application").get("applicationCode")), pattern),
                        cb.like(cb.lower(root.get("application").get("eventName")), pattern),
                        cb.like(cb.lower(root.get("requestedBy").get("username")), pattern),
                        cb.like(cb.lower(root.get("requestedBy").get("firstName")), pattern),
                        cb.like(cb.lower(root.get("requestedBy").get("lastName")), pattern)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return PagedResponse.from(cancellationRepository.findAll(spec, pageable).map(CancellationRequestDto::from));
    }

    @Transactional
    public CancellationRequestDto approveCancellation(Long reqId, User admin, String comment) {
        CancellationRequest cr = cancellationRepository.findWithDetailsById(reqId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found."));
        if (cr.getStatus() != CancellationStatus.PENDING) {
            throw new BadRequestException("Only PENDING cancellation requests can be approved.");
        }

        CancellationPolicy policy = getOrCreatePolicyEntity();
        HallApplication app = cr.getApplication();
        BookingStatus prevStatus = app.getStatus();

        cr.setStatus(CancellationStatus.APPROVED);
        cr.setProcessedBy(admin.getFirstName() + " " + admin.getLastName() + " (@" + admin.getUsername() + ")");
        cr.setProcessedAt(Instant.now());
        cr.setAdminComment(comment != null && !comment.isBlank() ? comment.trim() : "Cancellation approved.");

        if (cr.getPaidAmount().compareTo(BigDecimal.ZERO) > 0 && cr.getEligibleRefundAmount().compareTo(BigDecimal.ZERO) > 0) {
            // Never mark refund COMPLETED automatically; keep PENDING_VERIFICATION / APPROVED until bank transfer is verified
            cr.setRefundStatus(RefundStatus.PENDING_VERIFICATION);
        } else {
            cr.setRefundStatus(RefundStatus.NOT_APPLICABLE);
        }

        if (policy.isReleaseHallOnApproval()) {
            app.setStatus(BookingStatus.CANCELLED);
            applicationRepository.save(app);
            releaseApplicationEquipment(app.getId());
        }

        CancellationRequest saved = cancellationRepository.save(cr);

        historyRepository.save(ApplicationHistory.builder()
                .application(app)
                .actorUsername(admin.getUsername())
                .actorFullName(admin.getFirstName() + " " + admin.getLastName())
                .actorRole("ADMIN")
                .action("CANCELLATION_APPROVED")
                .previousStatus(prevStatus)
                .newStatus(app.getStatus())
                .comment(cr.getAdminComment() + (policy.isReleaseHallOnApproval() ? " (Hall & equipment released)" : ""))
                .build());

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .cancellationRequestId(saved.getId())
                .actorUsername(admin.getUsername())
                .actorRole("ADMIN")
                .actionType("CANCELLATION_APPROVED")
                .amount(cr.getEligibleRefundAmount())
                .details("Cancellation approved by admin. Refund status: " + cr.getRefundStatus())
                .build());

        notificationService.notifyUser(
                app.getApplicant(),
                "Cancellation Approved (" + app.getApplicationCode() + ")",
                "Your cancellation request for '" + app.getEventName() + "' was approved."
                        + (cr.getRefundStatus() == RefundStatus.PENDING_VERIFICATION
                        ? " Refund of $" + cr.getEligibleRefundAmount() + " is pending verification." : ""),
                "INFO",
                app
        );

        return CancellationRequestDto.from(saved);
    }

    @Transactional
    public CancellationRequestDto rejectCancellation(Long reqId, User admin, String reason) {
        CancellationRequest cr = cancellationRepository.findWithDetailsById(reqId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found."));
        if (cr.getStatus() != CancellationStatus.PENDING) {
            throw new BadRequestException("Only PENDING cancellation requests can be rejected.");
        }

        HallApplication app = cr.getApplication();
        cr.setStatus(CancellationStatus.REJECTED);
        cr.setRefundStatus(RefundStatus.REJECTED);
        cr.setProcessedBy(admin.getFirstName() + " " + admin.getLastName() + " (@" + admin.getUsername() + ")");
        cr.setProcessedAt(Instant.now());
        cr.setAdminComment(reason.trim());

        CancellationRequest saved = cancellationRepository.save(cr);

        historyRepository.save(ApplicationHistory.builder()
                .application(app)
                .actorUsername(admin.getUsername())
                .actorFullName(admin.getFirstName() + " " + admin.getLastName())
                .actorRole("ADMIN")
                .action("CANCELLATION_REJECTED")
                .previousStatus(app.getStatus())
                .newStatus(app.getStatus())
                .comment(reason.trim())
                .build());

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .cancellationRequestId(saved.getId())
                .actorUsername(admin.getUsername())
                .actorRole("ADMIN")
                .actionType("CANCELLATION_REJECTED")
                .amount(BigDecimal.ZERO)
                .details("Cancellation rejected: " + reason.trim())
                .build());

        notificationService.notifyUser(
                app.getApplicant(),
                "Cancellation Rejected (" + app.getApplicationCode() + ")",
                "Your cancellation request for '" + app.getEventName() + "' was rejected: " + reason.trim(),
                "ERROR",
                app
        );

        return CancellationRequestDto.from(saved);
    }

    @Transactional
    public CancellationRequestDto completeRefund(Long reqId, User admin, CompleteRefundRequest req) {
        CancellationRequest cr = cancellationRepository.findWithDetailsById(reqId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found."));
        if (cr.getStatus() != CancellationStatus.APPROVED) {
            throw new BadRequestException("Cancellation request must be APPROVED before completing a refund.");
        }
        if (cr.getPaidAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("No payment was made on this booking; refund is not applicable.");
        }
        if (cr.getRefundStatus() == RefundStatus.COMPLETED) {
            throw new BadRequestException("Refund has already been completed for this request.");
        }
        if (req.getRefundAmount().compareTo(cr.getPaidAmount()) > 0) {
            throw new BadRequestException("Refund amount ($" + req.getRefundAmount() + ") cannot exceed paid amount ($" + cr.getPaidAmount() + ").");
        }

        HallApplication app = cr.getApplication();
        cr.setApprovedRefundAmount(req.getRefundAmount().setScale(2, RoundingMode.HALF_UP));
        cr.setRefundTransactionRef(req.getTransactionRef().trim());
        cr.setRefundStatus(RefundStatus.COMPLETED);
        cr.setRefundCompletedAt(Instant.now());
        cr.setProcessedBy(admin.getFirstName() + " " + admin.getLastName() + " (@" + admin.getUsername() + ")");
        if (req.getAdminComment() != null && !req.getAdminComment().isBlank()) {
            cr.setAdminComment(req.getAdminComment().trim());
        }

        CancellationRequest saved = cancellationRepository.save(cr);

        historyRepository.save(ApplicationHistory.builder()
                .application(app)
                .actorUsername(admin.getUsername())
                .actorFullName(admin.getFirstName() + " " + admin.getLastName())
                .actorRole("ADMIN")
                .action("REFUND_COMPLETED")
                .previousStatus(app.getStatus())
                .newStatus(app.getStatus())
                .comment("Refunded $" + saved.getApprovedRefundAmount() + " | Ref: " + saved.getRefundTransactionRef())
                .build());

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .cancellationRequestId(saved.getId())
                .actorUsername(admin.getUsername())
                .actorRole("ADMIN")
                .actionType("REFUND_COMPLETED")
                .amount(saved.getApprovedRefundAmount())
                .transactionReference(saved.getRefundTransactionRef())
                .details(cr.getAdminComment() != null ? cr.getAdminComment() : "Refund verified and completed.")
                .build());

        notificationService.notifyUser(
                app.getApplicant(),
                "Refund Completed (" + app.getApplicationCode() + ")",
                "Your refund of $" + saved.getApprovedRefundAmount() + " (Ref: " + saved.getRefundTransactionRef()
                        + ") has been processed and verified.",
                "SUCCESS",
                app
        );

        return CancellationRequestDto.from(saved);
    }

    @Transactional
    public CancellationRequestDto rejectRefund(Long reqId, User admin, String reason) {
        CancellationRequest cr = cancellationRepository.findWithDetailsById(reqId)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found."));
        if (cr.getRefundStatus() == RefundStatus.COMPLETED || cr.getRefundStatus() == RefundStatus.NOT_APPLICABLE) {
            throw new BadRequestException("Refund cannot be rejected in status: " + cr.getRefundStatus());
        }

        HallApplication app = cr.getApplication();
        cr.setRefundStatus(RefundStatus.REJECTED);
        cr.setAdminComment(reason.trim());
        cr.setProcessedBy(admin.getFirstName() + " " + admin.getLastName() + " (@" + admin.getUsername() + ")");
        CancellationRequest saved = cancellationRepository.save(cr);

        financialAuditLogRepository.save(FinancialAuditLog.builder()
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .cancellationRequestId(saved.getId())
                .actorUsername(admin.getUsername())
                .actorRole("ADMIN")
                .actionType("REFUND_REJECTED")
                .amount(BigDecimal.ZERO)
                .details("Refund rejected: " + reason.trim())
                .build());

        notificationService.notifyUser(
                app.getApplicant(),
                "Refund Request Declined (" + app.getApplicationCode() + ")",
                "Refund for '" + app.getEventName() + "' was declined: " + reason.trim(),
                "ERROR",
                app
        );

        return CancellationRequestDto.from(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<FinancialAuditLogDto> getFinancialAuditLogs(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        return PagedResponse.from(
                financialAuditLogRepository.findAllByOrderByCreatedAtDesc(pageable).map(FinancialAuditLogDto::from)
        );
    }

    private void releaseApplicationEquipment(Long appId) {
        List<EquipmentReservation> items = equipmentReservationRepository.findByApplicationIdOrderByIdAsc(appId);
        for (EquipmentReservation item : items) {
            if (item.getStatus() == EquipmentRequestStatus.PENDING || item.getStatus() == EquipmentRequestStatus.APPROVED) {
                item.setStatus(EquipmentRequestStatus.RELEASED);
                equipmentReservationRepository.save(item);
            }
        }
    }

    private int calculateRefundPercent(HallApplication app, CancellationPolicy policy) {
        LocalDateTime eventStart = LocalDateTime.of(app.getEventDate(), app.getStartTime());
        long hoursUntilEvent = Duration.between(
                Instant.now(),
                eventStart.atZone(ZoneId.systemDefault()).toInstant()
        ).toHours();

        if (hoursUntilEvent >= policy.getFullRefundHoursBefore()) {
            return 100;
        }
        if (hoursUntilEvent >= policy.getPartialRefundHoursBefore()) {
            return policy.getPartialRefundPercent();
        }
        return 0;
    }

    private CancellationPolicy getOrCreatePolicyEntity() {
        return policyRepository.findFirstByActiveTrueOrderByIdAsc()
                .orElseGet(() -> policyRepository.save(CancellationPolicy.builder()
                        .name("Standard University Cancellation Policy")
                        .fullRefundHoursBefore(48)
                        .partialRefundHoursBefore(24)
                        .partialRefundPercent(50)
                        .releaseHallOnApproval(true)
                        .description("100% refund if cancelled 48+ hours before event; 50% refund between 24–48 hours; 0% under 24 hours.")
                        .active(true)
                        .build()));
    }
}
