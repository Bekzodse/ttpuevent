package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "High-level administrator summary counters")
public class AdminStatsDto {
    @Schema(description = "Total registered users", example = "45")
    private long totalUsers;
    @Schema(description = "Active user accounts", example = "42")
    private long activeAccounts;
    @Schema(description = "Deactivated user accounts", example = "3")
    private long inactiveAccounts;
    @Schema(description = "Users active in the last 15 minutes", example = "5")
    private long currentlyActiveUsers;
    @Schema(description = "Users who have signed in at least once", example = "39")
    private long usersWhoLoggedIn;
    @Schema(description = "Admin user count", example = "2")
    private long totalAdmins;
    @Schema(description = "Regular user count", example = "43")
    private long totalRegularUsers;
    @Schema(description = "Total events in catalog", example = "8")
    private long totalEvents;
    @Schema(description = "Upcoming events count", example = "7")
    private long upcomingEvents;
    @Schema(description = "Completed events count", example = "1")
    private long completedEvents;
    @Schema(description = "Total campus event registrations", example = "940")
    private long totalEventRegistrations;
    @Schema(description = "Total hall booking applications", example = "18")
    private long totalApplications;
    @Schema(description = "Pending or under-review applications", example = "4")
    private long pendingApplications;
    @Schema(description = "Approved / payment / confirmed applications", example = "11")
    private long approvedApplications;
    @Schema(description = "Rejected applications", example = "2")
    private long rejectedApplications;
}
