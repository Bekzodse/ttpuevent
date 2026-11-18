package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.HallApplication;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HallApplicationDto {
    private Long id;
    private String applicationCode;
    private Long applicantId;
    private String applicantUsername;
    private String applicantFirstName;
    private String applicantLastName;
    private String applicantPhoneNumber;
    private EventHallDto hall;
    private String eventName;
    private String eventType;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer expectedParticipants;
    private String description;
    private BookingStatus status;
    private BookingStatus paymentStatus;
    private String adminComment;
    private String userReply;
    private BigDecimal requiredAmount;
    private String bankCardNumber;
    private String bankCardHolder;
    private String bankName;
    private String receiptUrl;
    private String receiptFilename;
    private Instant receiptUploadedAt;
    private Instant approvedAt;
    private Instant paymentDeadline;
    private Instant paymentVerifiedAt;
    private String verifiedByAdmin;
    private Instant confirmedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ApplicationHistoryDto> history;
    private List<EquipmentReservationDto> equipmentReservations;
    private CancellationRequestDto cancellationRequest;

    public static HallApplicationDto from(
            HallApplication app,
            List<ApplicationHistoryDto> history,
            List<EquipmentReservationDto> equipmentReservations,
            CancellationRequestDto cancellationRequest) {
        String receiptUrl = app.getReceiptFilename() != null && !app.getReceiptFilename().isBlank()
                ? "/api/files/receipts/" + app.getReceiptFilename()
                : null;

        return HallApplicationDto.builder()
                .id(app.getId())
                .applicationCode(app.getApplicationCode())
                .applicantId(app.getApplicant().getId())
                .applicantUsername(app.getApplicant().getUsername())
                .applicantFirstName(app.getApplicantFirstName())
                .applicantLastName(app.getApplicantLastName())
                .applicantPhoneNumber(app.getApplicantPhoneNumber())
                .hall(EventHallDto.from(app.getHall()))
                .eventName(app.getEventName())
                .eventType(app.getEventType())
                .eventDate(app.getEventDate())
                .startTime(app.getStartTime())
                .endTime(app.getEndTime())
                .expectedParticipants(app.getExpectedParticipants())
                .description(app.getDescription())
                .status(app.getStatus())
                .paymentStatus(app.getPaymentStatus())
                .adminComment(app.getAdminComment())
                .userReply(app.getUserReply())
                .requiredAmount(app.getRequiredAmount())
                .bankCardNumber(app.getBankCardNumber())
                .bankCardHolder(app.getBankCardHolder())
                .bankName(app.getBankName())
                .receiptUrl(receiptUrl)
                .receiptFilename(app.getReceiptFilename())
                .receiptUploadedAt(app.getReceiptUploadedAt())
                .approvedAt(app.getApprovedAt())
                .paymentDeadline(app.getPaymentDeadline())
                .paymentVerifiedAt(app.getPaymentVerifiedAt())
                .verifiedByAdmin(app.getVerifiedByAdmin())
                .confirmedAt(app.getConfirmedAt())
                .createdAt(app.getCreatedAt())
                .updatedAt(app.getUpdatedAt())
                .history(history)
                .equipmentReservations(equipmentReservations != null ? equipmentReservations : List.of())
                .cancellationRequest(cancellationRequest)
                .build();
    }

    public static HallApplicationDto from(HallApplication app, List<ApplicationHistoryDto> history) {
        return from(app, history, List.of(), null);
    }
}
