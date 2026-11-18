package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Dynamic platform statistics, trends, and utilization analytics")
public class AdminAnalyticsDto {

    // Core KPIs
    private long totalEvents;
    private long upcomingEvents;
    private long completedEvents;
    private long cancelledEvents;
    private long draftEvents;
    private long publishedEvents;

    private long totalUsers;
    private long activeAccounts;
    private long inactiveAccounts;
    private long currentlyActiveUsers;
    private long usersWhoLoggedIn;
    private long totalAdmins;
    private long totalRegularUsers;

    private long totalApplications;
    private long pendingApplications;
    private long approvedApplications;
    private long rejectedApplications;
    private long cancelledApplications;
    private long expiredApplications;
    private long confirmedApplications;

    private long totalEventRegistrations;
    private long totalEventCapacity;
    private double eventFillRatePercent;

    private double approvalRatePercent;
    private double rejectionRatePercent;
    private double cancellationRatePercent;
    private BigDecimal totalConfirmedRevenue;

    // Charts & Breakdowns
    private List<StatusCountItem> applicationStatusBreakdown;
    private List<MonthlyTrendItem> monthlyApplicationTrends;
    private List<CategoryParticipationItem> eventParticipationByCategory;
    private List<PopularEventItem> popularEvents;
    private List<HallUtilizationItem> hallUtilization;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusCountItem {
        private String status;
        private String label;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrendItem {
        private String month;      // YYYY-MM
        private String label;      // e.g. Nov 2026
        private long total;
        private long approved;
        private long rejected;
        private long pending;
        private long cancelled;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryParticipationItem {
        private String category;
        private long eventCount;
        private long totalCapacity;
        private long totalRegistered;
        private double fillRatePercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularEventItem {
        private Long id;
        private String title;
        private String category;
        private LocalDate date;
        private String location;
        private Integer capacity;
        private Integer registered;
        private double fillRatePercent;
        private String status;
        private boolean published;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HallUtilizationItem {
        private Long hallId;
        private String hallName;
        private long totalApplications;
        private long confirmedCount;
        private BigDecimal confirmedRevenue;
    }
}
