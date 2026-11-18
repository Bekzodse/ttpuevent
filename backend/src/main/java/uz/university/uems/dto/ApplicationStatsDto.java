package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatsDto {
    private long totalApplications;
    private long pendingCount;
    private long underReviewCount;
    private long paymentPendingCount;
    private long paymentUnderReviewCount;
    private long confirmedCount;
    private long rejectedCount;
    private long expiredCount;
    private long cancelledCount;
}
