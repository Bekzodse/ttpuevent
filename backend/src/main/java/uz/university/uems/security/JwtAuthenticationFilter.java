package uz.university.uems.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String JWT_ERROR_ATTR = "jwt_error_message";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            request.setAttribute(JWT_ERROR_ATTR, "Authentication token is missing.");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String username = jwtService.extractUsername(token);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserPrincipal principal = (UserPrincipal) userDetailsService.loadUserByUsername(username);
                if (!principal.isEnabled()) {
                    request.setAttribute(JWT_ERROR_ATTR, "Your account has been deactivated by an administrator.");
                } else {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    principal, null, principal.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    userDetailsService.touchLastActivityIfNeeded(principal);
                }
            }
        } catch (ExpiredJwtException ex) {
            request.setAttribute(JWT_ERROR_ATTR, "Your session has expired. Please log in again.");
        } catch (JwtException | IllegalArgumentException ex) {
            request.setAttribute(JWT_ERROR_ATTR, "Invalid authentication token.");
        } catch (UsernameNotFoundException ex) {
            request.setAttribute(JWT_ERROR_ATTR, "Account associated with this token no longer exists.");
        } catch (Exception ex) {
            log.warn("Unexpected error during JWT authentication: {}", ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
