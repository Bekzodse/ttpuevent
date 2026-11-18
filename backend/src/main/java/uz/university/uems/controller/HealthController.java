package uz.university.uems.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Branding & System")
public class HealthController {

    @Operation(summary = "Service health check", description = "Public endpoint returning backend operational status and UTC timestamp.")
    @ApiResponse(responseCode = "200", description = "Service is healthy")
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "uems-backend",
                "timestamp", Instant.now().toString()
        ));
    }
}
