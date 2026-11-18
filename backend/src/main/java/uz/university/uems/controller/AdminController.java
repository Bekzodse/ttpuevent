package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.university.uems.dto.*;
import uz.university.uems.entity.Role;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.AdminService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/users")
    public ResponseEntity<PagedResponse<UserDto>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean loggedIn,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(
                adminService.listUsers(search, role, active, loggedIn, page, size, sortBy, sortDir)
        );
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserDto> updateUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(principal.getId(), id, request));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<UserDto> updateUserStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateUserStatus(principal.getId(), id, request.getActive()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        adminService.deleteUser(principal.getId(), id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully."));
    }

    @GetMapping("/login-activity")
    public ResponseEntity<PagedResponse<LoginActivityDto>> getLoginActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(adminService.getLoginActivities(page, size));
    }

    @GetMapping("/users/{id}/login-history")
    public ResponseEntity<List<LoginActivityDto>> getUserLoginHistory(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserLoginHistory(id));
    }
}
