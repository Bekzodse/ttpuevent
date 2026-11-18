package uz.university.uems.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "UEMS — University Management & Event Hall Portal API",
                version = "1.0.0",
                description = """
                        Complete REST API documentation for the University Event & Hall Management System (UEMS).
                        
                        **Authentication:**
                        - Obtain a JWT Bearer token via `POST /api/auth/login` or `POST /api/auth/register`.
                        - Click the **Authorize** button and enter your token (without the `Bearer ` prefix — Swagger UI adds it automatically).
                        - Endpoints marked with a lock require authentication; `ADMIN` role requirements are documented per operation.
                        """,
                contact = @Contact(
                        name = "Turin Polytechnic University in Tashkent — UEMS Team",
                        email = "info@polito.uz",
                        url = "https://turin.uz"
                ),
                license = @License(
                        name = "University Internal / MIT",
                        url = "https://opensource.org/licenses/MIT"
                )
        ),
        tags = {
                @Tag(name = "Authentication", description = "Account registration, JWT login, and current session profile"),
                @Tag(name = "Users", description = "Authenticated user profile, password management, and avatar upload"),
                @Tag(name = "Admin", description = "Administrator user management, login logs, and administrative audit logs (ADMIN role)"),
                @Tag(name = "Statistics", description = "Platform KPIs, application statistics, and dynamic analytics (ADMIN role)"),
                @Tag(name = "Events", description = "Campus event discovery, participant registration, and Admin Events CRUD"),
                @Tag(name = "Applications", description = "Event hall booking applications, review workflow, and PDF confirmations"),
                @Tag(name = "Bookings", description = "Event halls, availability calendar, schedule blocks, and equipment inventory"),
                @Tag(name = "Payments", description = "Payment receipt upload, bank verification, cancellations, refunds, and financial audit"),
                @Tag(name = "Notifications", description = "In-app and real-time user/admin notifications"),
                @Tag(name = "Files", description = "Public and protected file download endpoints (avatars, logos, event images, receipts)"),
                @Tag(name = "Branding & System", description = "University branding theme settings and service health check")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER,
        description = "Enter your JWT access token obtained from /api/auth/login or /api/auth/register"
)
public class OpenApiConfig {

    @Value("${app.openapi.local-url:http://localhost:8080}")
    private String localServerUrl;

    @Value("${app.openapi.prod-url:https://api.turin-uems.uz}")
    private String prodServerUrl;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .servers(List.of(
                        new Server().url(localServerUrl).description("Local Development Server"),
                        new Server().url(prodServerUrl).description("Production Server")
                ));
    }

    @Bean
    public GroupedOpenApi allApisGroup() {
        return GroupedOpenApi.builder()
                .group("all-apis")
                .displayName("All APIs")
                .pathsToMatch("/api/**")
                .build();
    }

    @Bean
    public GroupedOpenApi publicAndUserApisGroup() {
        return GroupedOpenApi.builder()
                .group("public-and-user")
                .displayName("Public & Student APIs")
                .pathsToMatch("/api/**")
                .pathsToExclude("/api/admin/**")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApisGroup() {
        return GroupedOpenApi.builder()
                .group("admin-only")
                .displayName("Admin Management APIs")
                .pathsToMatch("/api/admin/**")
                .build();
    }
}
