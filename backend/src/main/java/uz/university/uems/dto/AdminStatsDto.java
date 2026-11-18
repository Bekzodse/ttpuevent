package uz.university.uems.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long activeAccounts;
    private long inactiveAccounts;
    private long currentlyActiveUsers;
    private long usersWhoLoggedIn;
    private long totalAdmins;
    private long totalRegularUsers;
    private long totalEvents;
    private long totalEventRegistrations;
}
