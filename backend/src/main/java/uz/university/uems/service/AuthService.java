package uz.university.uems.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.AuthResponse;
import uz.university.uems.dto.LoginRequest;
import uz.university.uems.dto.RegisterRequest;
import uz.university.uems.dto.UserDto;
import uz.university.uems.entity.LoginActivity;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.repository.LoginActivityRepository;
import uz.university.uems.repository.UserRepository;
import uz.university.uems.security.JwtService;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LoginActivityRepository loginActivityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        String username = InputNormalizer.normalizeUsername(request.getUsername());
        String phone = InputNormalizer.normalizePhone(request.getPhoneNumber());
        String firstName = InputNormalizer.normalizeName(request.getFirstName());
        String lastName = InputNormalizer.normalizeName(request.getLastName());

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken.");
        }
        if (userRepository.existsByPhoneNumber(phone)) {
            throw new DuplicateResourceException("Phone number '" + phone + "' is already registered.");
        }

        Instant now = Instant.now();
        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .phoneNumber(phone)
                .username(username)
                .email(request.getEmail() != null && !request.getEmail().isBlank()
                        ? request.getEmail().trim().toLowerCase()
                        : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .department(request.getDepartment() != null && !request.getDepartment().isBlank()
                        ? request.getDepartment().trim()
                        : null)
                .role(Role.USER)
                .active(true)
                .lastLoginAt(now)
                .lastActivityAt(now)
                .build();

        User saved = userRepository.save(user);
        recordLoginActivity(saved, httpRequest, true);

        String token = jwtService.generateToken(saved);
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMs())
                .user(UserDto.from(saved))
                .build();
    }

    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        String username = InputNormalizer.normalizeUsername(request.getUsername());
        User existingUser = userRepository.findByUsernameIgnoreCase(username).orElse(null);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );
        } catch (DisabledException ex) {
            if (existingUser != null) {
                recordLoginActivity(existingUser, httpRequest, false);
            }
            throw ex;
        } catch (BadCredentialsException ex) {
            if (existingUser != null) {
                recordLoginActivity(existingUser, httpRequest, false);
            }
            throw new BadCredentialsException("Invalid username or password.");
        }

        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));

        Instant now = Instant.now();
        user.setLastLoginAt(now);
        user.setLastActivityAt(now);
        userRepository.save(user);

        recordLoginActivity(user, httpRequest, true);

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationMs())
                .user(UserDto.from(user))
                .build();
    }

    private void recordLoginActivity(User user, HttpServletRequest httpRequest, boolean successful) {
        String ip = extractClientIp(httpRequest);
        String ua = httpRequest != null ? httpRequest.getHeader("User-Agent") : null;
        if (ua != null && ua.length() > 250) {
            ua = ua.substring(0, 250);
        }
        loginActivityRepository.save(LoginActivity.builder()
                .user(user)
                .loginTime(Instant.now())
                .ipAddress(ip)
                .userAgent(ua)
                .successful(successful)
                .build());
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
