package uz.university.uems;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;
import uz.university.uems.repository.ApplicationHistoryRepository;
import uz.university.uems.repository.CancellationRequestRepository;
import uz.university.uems.repository.EquipmentReservationRepository;
import uz.university.uems.repository.EventRegistrationRepository;
import uz.university.uems.repository.HallApplicationRepository;
import uz.university.uems.repository.HallScheduleBlockRepository;
import uz.university.uems.repository.LoginActivityRepository;
import uz.university.uems.repository.NotificationRepository;
import uz.university.uems.repository.UniversityEventRepository;
import uz.university.uems.repository.UserRepository;

import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UemsIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private LoginActivityRepository loginActivityRepository;
    @Autowired private EventRegistrationRepository eventRegistrationRepository;
    @Autowired private UniversityEventRepository eventRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ApplicationHistoryRepository historyRepository;
    @Autowired private HallApplicationRepository applicationRepository;
    @Autowired private CancellationRequestRepository cancellationRequestRepository;
    @Autowired private EquipmentReservationRepository equipmentReservationRepository;
    @Autowired private HallScheduleBlockRepository scheduleBlockRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private User adminUser;

    @BeforeEach
    void setup() {
        notificationRepository.deleteAll();
        cancellationRequestRepository.deleteAll();
        equipmentReservationRepository.deleteAll();
        historyRepository.deleteAll();
        scheduleBlockRepository.deleteAll();
        applicationRepository.deleteAll();
        eventRegistrationRepository.deleteAll();
        eventRepository.deleteAll();
        loginActivityRepository.deleteAll();
        userRepository.deleteAll();

        adminUser = userRepository.save(User.builder()
                .firstName("System")
                .lastName("Admin")
                .phoneNumber("+998901111111")
                .username("sysadmin")
                .password(passwordEncoder.encode("Admin123!"))
                .role(Role.ADMIN)
                .active(true)
                .build());
    }

    @Test
    void registerLoginProfileAvatarAndAdminWorkflow() throws Exception {
        // 1. Validation error on invalid registration
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "A",
                                "lastName", "",
                                "phoneNumber", "bad",
                                "username", "ab",
                                "password", "123"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.firstName").exists())
                .andExpect(jsonPath("$.fieldErrors.phoneNumber").exists())
                .andExpect(jsonPath("$.fieldErrors.username").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());

        // 2. Successful registration
        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Ali",
                                "lastName", "Valiyev",
                                "phoneNumber", "+998 90 555-44-33",
                                "username", "alivaliyev",
                                "password", "Secret123!",
                                "department", "Computer Science"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.username").value("alivaliyev"))
                .andExpect(jsonPath("$.user.phoneNumber").value("+998905554433"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String userToken = regJson.get("token").asText();
        long userId = regJson.get("user").get("id").asLong();

        // Password must be BCrypt hashed in DB
        User dbUser = userRepository.findById(userId).orElseThrow();
        assertThat(dbUser.getPassword()).isNotEqualTo("Secret123!");
        assertThat(passwordEncoder.matches("Secret123!", dbUser.getPassword())).isTrue();

        // 3. Duplicate username & duplicate phone number rejected with 409
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Other",
                                "lastName", "Student",
                                "phoneNumber", "+998909998877",
                                "username", "AliValiyev",
                                "password", "Secret123!"
                        ))))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Other",
                                "lastName", "Student",
                                "phoneNumber", "+998905554433",
                                "username", "otherstudent",
                                "password", "Secret123!"
                        ))))
                .andExpect(status().isConflict());

        // 4. Wrong password rejected with 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "alivaliyev",
                                "password", "WrongPass!"
                        ))))
                .andExpect(status().isUnauthorized());

        // 5. Regular user cannot access admin endpoints -> 403 Forbidden
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());

        // 6. Unauthorized / expired JWT token -> 401
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());

        String expiredToken = Jwts.builder()
                .subject("alivaliyev")
                .issuedAt(new Date(System.currentTimeMillis() - 10000))
                .expiration(new Date(System.currentTimeMillis() - 5000))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)))
                .compact();
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Your session has expired. Please log in again."));

        // 7. Profile update
        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Alijon",
                                "lastName", "Valiyev",
                                "phoneNumber", "+998905554499",
                                "department", "AI & Robotics",
                                "bio", "University student"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Alijon"))
                .andExpect(jsonPath("$.phoneNumber").value("+998905554499"));

        // 8. Invalid image upload rejected (fake PNG header)
        MockMultipartFile fakeImage = new MockMultipartFile(
                "file", "hack.png", "image/png", "not-a-real-png".getBytes());
        mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(fakeImage)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isBadRequest());

        // 9. Valid PNG avatar upload, fetch, and delete
        byte[] validPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile realPng = new MockMultipartFile(
                "file", "avatar.png", "image/png", validPng);

        MvcResult avatarRes = mockMvc.perform(multipart("/api/users/me/avatar")
                        .file(realPng)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePictureUrl").isNotEmpty())
                .andReturn();

        String avatarUrl = objectMapper.readTree(avatarRes.getResponse().getContentAsString())
                .get("profilePictureUrl").asText();

        mockMvc.perform(get(avatarUrl))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));

        mockMvc.perform(delete("/api/users/me/avatar")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profilePictureUrl").isEmpty());

        mockMvc.perform(get(avatarUrl))
                .andExpect(status().isNotFound());

        // 10. Password change & re-login with new password
        mockMvc.perform(put("/api/users/me/password")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "Secret123!",
                                "newPassword", "NewSecret456!",
                                "confirmPassword", "NewSecret456!"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "alivaliyev",
                                "password", "NewSecret456!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        // 11. Admin login & management operations
        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "sysadmin",
                                "password", "Admin123!"
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = objectMapper.readTree(adminLogin.getResponse().getContentAsString())
                .get("token").asText();

        // Stats
        mockMvc.perform(get("/api/admin/stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(2))
                .andExpect(jsonPath("$.activeAccounts").value(2))
                .andExpect(jsonPath("$.usersWhoLoggedIn").value(2));

        // Search & filter
        mockMvc.perform(get("/api/admin/users?search=Alijon&role=USER")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("alivaliyev"));

        // Deactivate user -> blocks user's token & login
        mockMvc.perform(patch("/api/admin/users/" + userId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "alivaliyev",
                                "password", "NewSecret456!"
                        ))))
                .andExpect(status().isForbidden());

        // Admin cannot delete self
        mockMvc.perform(delete("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // Admin deletes student user
        mockMvc.perform(delete("/api/admin/users/" + userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertThat(userRepository.existsById(userId)).isFalse();
    }

    @Test
    void adminEditLoginActivityAndCampusEventsWorkflow() throws Exception {
        // Login as admin
        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "sysadmin",
                                "password", "Admin123!"
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        String adminToken = objectMapper.readTree(adminLogin.getResponse().getContentAsString())
                .get("token").asText();

        // Register student
        MvcResult regRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Sardor",
                                "lastName", "Aliyev",
                                "phoneNumber", "+998907776655",
                                "username", "sardor",
                                "password", "Pass123!"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode regJson = objectMapper.readTree(regRes.getResponse().getContentAsString());
        String studentToken = regJson.get("token").asText();
        long studentId = regJson.get("user").get("id").asLong();

        // Admin views login activity log
        mockMvc.perform(get("/api/admin/login-activity")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // Admin cannot demote self
        mockMvc.perform(put("/api/admin/users/" + adminUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "System",
                                "lastName", "Admin",
                                "phoneNumber", "+998901111111",
                                "username", "sysadmin",
                                "role", "USER",
                                "active", true
                        ))))
                .andExpect(status().isForbidden());

        // Admin edits student profile
        mockMvc.perform(put("/api/admin/users/" + studentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Sardorbek",
                                "lastName", "Aliyev",
                                "phoneNumber", "+998907776655",
                                "username", "sardor",
                                "role", "USER",
                                "active", true,
                                "department", "Engineering"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Sardorbek"));

        // Create event & register student
        MvcResult eventRes = mockMvc.perform(post("/api/events")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Robotics Workshop",
                                "description", "Hands-on university robotics lab session.",
                                "category", "Technology",
                                "date", "2026-12-20",
                                "time", "14:00",
                                "location", "Lab 301",
                                "organizer", "Robotics Club",
                                "capacity", 1
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        long eventId = objectMapper.readTree(eventRes.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(post("/api/events/" + eventId + "/register")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userRegistered").value(true))
                .andExpect(jsonPath("$.registered").value(1));

        // Duplicate registration blocked (409)
        mockMvc.perform(post("/api/events/" + eventId + "/register")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isConflict());

        // Unauthenticated /my events blocked (401)
        mockMvc.perform(get("/api/events/my"))
                .andExpect(status().isUnauthorized());

        // Path traversal blocked (4xx) & missing avatar returns 404
        mockMvc.perform(get("/api/files/avatars/..%2Fpom.xml"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(get("/api/files/avatars/missing-avatar.png"))
                .andExpect(status().isNotFound());
    }
}
