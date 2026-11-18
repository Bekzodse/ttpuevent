package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.FinancialAuditLog;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialAuditLogDto {
    private Long id;
    private Long applicationId;
    private String applicationCode;
    private Long cancellationRequestId;
    private String actorUsername;
    private String actorRole;
    private String actionType;
    private BigDecimal amount;
    private String transactionReference;
    private String details;
    private Instant createdAt;

    public static FinancialAuditLogDto from(FinancialAuditLog log) {
        return FinancialAuditLogDto.builder()
                .id(log.getId())
                .applicationId(log.getApplicationId())
                .applicationCode(log.getApplicationCode())
                .cancellationRequestId(log.getCancellationRequestId())
                .actorUsername(log.getActorUsername())
                .actorRole(log.getActorRole())
                .actionType(log.getActionType())
                .amount(log.getAmount())
                .transactionReference(log.getTransactionReference())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
