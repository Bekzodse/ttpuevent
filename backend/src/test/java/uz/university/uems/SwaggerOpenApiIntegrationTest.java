package uz.university.uems;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SwaggerOpenApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @Test
    void openApiDocsAndSwaggerUiAreAccessibleAndDocumentAllControllers() throws Exception {
        // 1. Swagger UI endpoints accessible publicly without JWT
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());

        // 2. Grouped OpenAPI specs accessible publicly
        mockMvc.perform(get("/v3/api-docs/public-and-user")).andExpect(status().isOk());
        mockMvc.perform(get("/v3/api-docs/admin-only")).andExpect(status().isOk());

        MvcResult docsRes = mockMvc.perform(get("/v3/api-docs/all-apis"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode spec = objectMapper.readTree(docsRes.getResponse().getContentAsString());

        // 3. Info, Servers, and Security Scheme
        assertThat(spec.path("info").path("title").asText())
                .contains("UEMS");
        assertThat(spec.path("info").path("version").asText()).isEqualTo("1.0.0");
        assertThat(spec.path("servers").size()).isGreaterThanOrEqualTo(2);

        JsonNode bearerAuth = spec.path("components").path("securitySchemes").path("bearerAuth");
        assertThat(bearerAuth.path("type").asText()).isEqualTo("http");
        assertThat(bearerAuth.path("scheme").asText()).isEqualTo("bearer");
        assertThat(bearerAuth.path("bearerFormat").asText()).isEqualTo("JWT");

        // 4. Tags cover all documented categories
        Set<String> tagNames = new HashSet<>();
        spec.path("tags").forEach(t -> tagNames.add(t.path("name").asText()));
        assertThat(tagNames).contains(
                "Authentication",
                "Users",
                "Admin",
                "Statistics",
                "Events",
                "Applications",
                "Bookings",
                "Payments",
                "Notifications",
                "Files",
                "Branding & System"
        );

        // 5. All 14 controller path families are present in paths
        JsonNode paths = spec.path("paths");
        assertThat(paths.has("/api/auth/register")).isTrue();
        assertThat(paths.has("/api/auth/login")).isTrue();
        assertThat(paths.has("/api/auth/me")).isTrue();
        assertThat(paths.has("/api/users/me")).isTrue();
        assertThat(paths.has("/api/admin/users")).isTrue();
        assertThat(paths.has("/api/admin/stats")).isTrue();
        assertThat(paths.has("/api/admin/analytics")).isTrue();
        assertThat(paths.has("/api/admin/activity-logs")).isTrue();
        assertThat(paths.has("/api/events")).isTrue();
        assertThat(paths.has("/api/admin/events")).isTrue();
        assertThat(paths.has("/api/halls")).isTrue();
        assertThat(paths.has("/api/applications")).isTrue();
        assertThat(paths.has("/api/admin/applications")).isTrue();
        assertThat(paths.has("/api/admin/applications/{id}/status")).isTrue();
        assertThat(paths.has("/api/calendar")).isTrue();
        assertThat(paths.has("/api/equipment")).isTrue();
        assertThat(paths.has("/api/cancellation-policy")).isTrue();
        assertThat(paths.has("/api/cancellations/my")).isTrue();
        assertThat(paths.has("/api/notifications")).isTrue();
        assertThat(paths.has("/api/files/avatars/{filename}")).isTrue();
        assertThat(paths.has("/api/files/events/{filename}")).isTrue();
        assertThat(paths.has("/api/files/receipts/{filename}")).isTrue();
        assertThat(paths.has("/api/branding")).isTrue();
        assertThat(paths.has("/api/health")).isTrue();

        // 6. Verify public vs protected security metadata
        assertThat(paths.path("/api/auth/login").path("post").has("security")).isFalse();
        assertThat(paths.path("/api/health").path("get").has("security")).isFalse();
        assertThat(paths.path("/api/admin/analytics").path("get").path("security").toString())
                .contains("bearerAuth");

        // 7. Verify DTO schemas exist
        JsonNode schemas = spec.path("components").path("schemas");
        assertThat(schemas.has("LoginRequest")).isTrue();
        assertThat(schemas.has("RegisterRequest")).isTrue();
        assertThat(schemas.has("AuthResponse")).isTrue();
        assertThat(schemas.has("UserDto")).isTrue();
        assertThat(schemas.has("CreateEventRequest")).isTrue();
        assertThat(schemas.has("UpdateEventRequest")).isTrue();
        assertThat(schemas.has("HallApplicationDto")).isTrue();
        assertThat(schemas.has("AdminAnalyticsDto")).isTrue();
        assertThat(schemas.has("ErrorResponse")).isTrue();
    }
}
