package uz.university.uems.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.ChangePasswordRequest;
import uz.university.uems.dto.UpdateProfileRequest;
import uz.university.uems.dto.UserDto;
import uz.university.uems.security.UserPrincipal;
import uz.university.uems.service.UserService;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserDto> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.getCurrentUser(principal.getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(principal.getId(), request));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadAvatar(principal.getId(), file));
    }

    @DeleteMapping("/me/avatar")
    public ResponseEntity<UserDto> deleteAvatar(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(userService.deleteAvatar(principal.getId()));
    }
}
