package uz.university.uems.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.entity.User;
import uz.university.uems.repository.UserRepository;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return new UserPrincipal(user);
    }

    @Transactional
    public void touchLastActivityIfNeeded(UserPrincipal principal) {
        Instant now = Instant.now();
        Instant last = principal.getUser().getLastActivityAt();
        if (last == null || Duration.between(last, now).toSeconds() >= 30) {
            try {
                userRepository.updateLastActivity(principal.getId(), now);
                principal.getUser().setLastActivityAt(now);
            } catch (Exception ex) {
                log.debug("Failed to update lastActivityAt for user {}: {}", principal.getId(), ex.getMessage());
            }
        }
    }
}
