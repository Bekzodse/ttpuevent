package uz.university.uems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.*;
import uz.university.uems.entity.Role;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.AdminActivityLogService;
import uz.university.uems.service.AdminService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;
    private final AdminActivityLogService activityLogService;

    @Operation(
            summary = "Get high-level admin platform statistics (ADMIN)",
            description = "Requires ADMIN role. Dynamically computes user, event, registration, and application summary counts.",
            tags = {"Statistics"}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Summary statistics returned",
                    content = @Content(schema = @Schema(implementation = AdminStatsDto.class))),
            @ApiResponse(responseCode = "403", description = "ADMIN role required",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @Operation(
            summary = "Get full dynamic platform analytics (ADMIN)",
            description = "Requires ADMIN role. Computes real-time KPIs, monthly application trends, status breakdowns, event category participation, popular events, and hall utilization.",
            tags = {"Statistics"}
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Analytics payload returned",
                    content = @Content(schema = @Schema(implementation = AdminAnalyticsDto.class))),
            @ApiResponse(responseCode = "403", description = "ADMIN role required",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsDto> getAnalytics() {
        return ResponseEntity.ok(adminService.getAnalytics());
    }

    @Operation(
            summary = "List administrative activity audit logs (ADMIN)",
            description = "Requires ADMIN role. Returns paginated administrative actions (events, applications, users) with search and filtering."
    )
    @ApiResponse(responseCode = "200", description = "Paginated activity logs returned")
    @GetMapping("/activity-logs")
    public ResponseEntity<PagedResponse<AdminActivityLogDto>> getActivityLogs(
            @Parameter(description = "Keyword search across actor, target, action, or details") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by action type (e.g. EVENT_CREATED, APPLICATION_APPROVED)") @RequestParam(required = false) String actionType,
            @Parameter(description = "Filter by target type (EVENT, APPLICATION, USER)") @RequestParam(required = false) String targetType,
            @Parameter(description = "Zero-based page index") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (1-100)") @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(activityLogService.listLogs(search, actionType, targetType, page, size));
    }

    @Operation(summary = "List and filter users (ADMIN)", description = "Requires ADMIN role. Supports search, role, active, loggedIn filters, and sorting.")
    @ApiResponse(responseCode = "200", description = "Paginated users returned")
    @GetMapping("/users")
    public ResponseEntity<PagedResponse<UserDto>> listUsers(
            @Parameter(description = "Search by name, username, email, phone, or department") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by role (USER or ADMIN)") @RequestParam(required = false) Role role,
            @Parameter(description = "Filter by account active status") @RequestParam(required = false) Boolean active,
            @Parameter(description = "Filter by whether user has logged in before") @RequestParam(required = false) Boolean loggedIn,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(
                adminService.listUsers(search, role, active, loggedIn, page, size, sortBy, sortDir)
        );
    }

    @Operation(summary = "Get user details by ID (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User found", content = @Content(schema = @Schema(implementation = UserDto.class))),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@Parameter(description = "User ID", example = "2") @PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @Operation(summary = "Get user's hall applications & event registrations history (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "History retrieved", content = @Content(schema = @Schema(implementation = UserApplicationHistoryDto.class))),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping("/users/{id}/applications")
    public ResponseEntity<UserApplicationHistoryDto> getUserApplications(@Parameter(description = "User ID", example = "2") @PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserApplicationHistory(id));
    }

    @Operation(summary = "Update user account details (ADMIN)", description = "Requires ADMIN role. Prevents admins from demoting or deactivating their own account.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated", content = @Content(schema = @Schema(implementation = UserDto.class))),
            @ApiResponse(responseCode = "403", description = "Self-demotion/deactivation forbidden", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Duplicate username or phone", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "Target user ID", example = "2") @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(principal.getId(), id, request));
    }

    @Operation(summary = "Activate or deactivate user account (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "Account status updated", content = @Content(schema = @Schema(implementation = UserDto.class)))
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserDto> updateUserStatus(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "Target user ID", example = "2") @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUserStatus(principal.getId(), id, request.getActive()));
    }

    @Operation(summary = "Delete user account permanently (ADMIN)", description = "Requires ADMIN role. Removes user and cascading applications, notifications, and registrations.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User deleted"),
            @ApiResponse(responseCode = "403", description = "Cannot delete own admin account", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @Parameter(hidden = true) @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "Target user ID", example = "2") @PathVariable Long id) {
        adminService.deleteUser(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }

    @Operation(summary = "List user login activity (ADMIN)", description = "Requires ADMIN role. Paginated recent login attempts.")
    @ApiResponse(responseCode = "200", description = "Login activity page returned")
    @GetMapping("/login-activity")
    public ResponseEntity<PagedResponse<LoginActivityDto>> getLoginActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(adminService.getLoginActivities(page, size));
    }

    @Operation(summary = "Get user's last 10 login attempts (ADMIN)", description = "Requires ADMIN role.")
    @ApiResponse(responseCode = "200", description = "User login history returned")
    @GetMapping("/users/{id}/login-history")
    public ResponseEntity<List<LoginActivityDto>> getUserLoginHistory(@Parameter(description = "User ID", example = "2") @PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserLoginHistory(id));
    }
}
