package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.CancellationRequest;
import uz.university.uems.entity.CancellationStatus;
import uz.university.uems.entity.RefundStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancellationRequestDto {
    private Long id;
    private Long applicationId;
    private String applicationCode;
    private String eventName;
    private String hallName;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus bookingStatus;
    private Long requestedById;
    private String requestedByUsername;
    private String requestedByFullName;
    private String requestedByPhone;
    private String reason;
    private CancellationStatus status;
    private RefundStatus refundStatus;
    private BigDecimal paidAmount;
    private Integer eligibleRefundPercent;
    private BigDecimal eligibleRefundAmount;
    private BigDecimal approvedRefundAmount;
    private String refundTransactionRef;
    private String adminComment;
    private String processedBy;
    private Instant requestedAt;
    private Instant processedAt;
    private Instant refundCompletedAt;

    public static CancellationRequestDto from(CancellationRequest c) {
        var app = c.getApplication();
        var user = c.getRequestedBy();
        return CancellationRequestDto.builder()
                .id(c.getId())
                .applicationId(app.getId())
                .applicationCode(app.getApplicationCode())
                .eventName(app.getEventName())
                .hallName(app.getHall().getName())
                .eventDate(app.getEventDate())
                .startTime(app.getStartTime())
                .endTime(app.getEndTime())
                .bookingStatus(app.getStatus())
                .requestedById(user.getId())
                .requestedByUsername(user.getUsername())
                .requestedByFullName(user.getFirstName() + " " + user.getLastName())
                .requestedByPhone(user.getPhoneNumber())
                .reason(c.getReason())
                .status(c.getStatus())
                .refundStatus(c.getRefundStatus())
                .paidAmount(c.getPaidAmount())
                .eligibleRefundPercent(c.getEligibleRefundPercent())
                .eligibleRefundAmount(c.getEligibleRefundAmount())
                .approvedRefundAmount(c.getApprovedRefundAmount())
                .refundTransactionRef(c.getRefundTransactionRef())
                .adminComment(c.getAdminComment())
                .processedBy(c.getProcessedBy())
                .requestedAt(c.getRequestedAt())
                .processedAt(c.getProcessedAt())
                .refundCompletedAt(c.getRefundCompletedAt())
                .build();
    }
}
