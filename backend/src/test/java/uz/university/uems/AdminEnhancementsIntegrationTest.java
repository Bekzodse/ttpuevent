package uz.university.uems;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import uz.university.uems.entity.EventHall;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;
import uz.university.uems.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminEnhancementsIntegrationTest {

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
    @Autowired private EventHallRepository hallRepository;
    @Autowired private AdminActivityLogRepository activityLogRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String studentToken;
    private Long studentId;
    private Long hallId;

    @BeforeEach
    void setup() throws Exception {
        activityLogRepository.deleteAll();
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
        hallRepository.deleteAll();

        userRepository.save(User.builder()
                .firstName("Bekzod")
                .lastName("Admin")
                .phoneNumber("+998901000001")
                .username("bekzod_admin")
                .email("bekzod@turin.uz")
                .password(passwordEncoder.encode("Admin123!"))
                .role(Role.ADMIN)
                .active(true)
                .build());

        EventHall hall = hallRepository.save(EventHall.builder()
                .name("The Annual Conference Hall")
                .building("Main Building")
                .floor("1st Floor")
                .capacity(250)
                .hourlyRate(new BigDecimal("70.00"))
                .active(true)
                .build());
        hallId = hall.getId();

        MvcResult adminLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "bekzod_admin",
                                "password", "Admin123!"
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = objectMapper.readTree(adminLogin.getResponse().getContentAsString()).get("token").asText();

        MvcResult studentReg = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "firstName", "Malika",
                                "lastName", "Yusupova",
                                "phoneNumber", "+998901234567",
                                "username", "malika",
                                "email", "malika@turin.uz",
                                "password", "Student123!"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode regJson = objectMapper.readTree(studentReg.getResponse().getContentAsString());
        studentToken = regJson.get("token").asText();
        studentId = regJson.get("user").get("id").asLong();
    }

    @Test
    void adminAuthorizationGuardsBlockRegularUsersAndAnonymous() throws Exception {
        mockMvc.perform(get("/api/admin/analytics")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/events")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/analytics")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/events")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/activity-logs")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/users/" + studentId + "/applications")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void completeAdminEventsApplicationsUsersAnalyticsAndLogsWorkflow() throws Exception {
        String futureDate = LocalDate.now().plusDays(14).toString();
        String pastDate = LocalDate.now().minusDays(5).toString();

        // 1. Admin creates Upcoming event & Completed event
        MvcResult createEventRes = mockMvc.perform(post("/api/admin/events")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "AI Innovation Summit",
                                "description", "Annual university artificial intelligence conference and demo day.",
                                "category", "Technology",
                                "date", futureDate,
                                "time", "10:00",
                                "location", "The Annual Conference Hall",
                                "organizer", "CS Department",
                                "capacity", 50,
                                "status", "Upcoming",
                                "published", true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.published").value(true))
                .andExpect(jsonPath("$.status").value("Upcoming"))
                .andReturn();
        long eventId = objectMapper.readTree(createEventRes.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/admin/events")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Fall Orientation Fair",
                                "description", "Welcome week orientation event for incoming students.",
                                "category", "Academic",
                                "date", pastDate,
                                "time", "09:00",
                                "location", "Green Hall",
                                "organizer", "Student Union",
                                "capacity", 100,
                                "status", "Completed",
                                "published", true
                        ))))
                .andExpect(status().isCreated());

        // 2. Admin uploads cover image for event & fetches it
        byte[] fakePng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        MockMultipartFile imgFile = new MockMultipartFile("file", "cover.png", "image/png", fakePng);
        MvcResult uploadRes = mockMvc.perform(multipart("/api/admin/events/" + eventId + "/image")
                        .file(imgFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").isNotEmpty())
                .andReturn();
        String imageUrl = objectMapper.readTree(uploadRes.getResponse().getContentAsString()).get("imageUrl").asText();
        mockMvc.perform(get(imageUrl)).andExpect(status().isOk());

        // 3. Student registers for the published event with student details
        mockMvc.perform(post("/api/events/" + eventId + "/register")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Malika Yusupova",
                                "phoneNumber", "+998901234567",
                                "email", "malika@turin.uz",
                                "department", "Computer Science",
                                "studentCode", "U221045",
                                "notes", "Looking forward to attending!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.registered").value(1));

        // Admin views event registrants with submitted details
        mockMvc.perform(get("/api/admin/events/" + eventId + "/registrations")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Malika Yusupova"))
                .andExpect(jsonPath("$[0].studentCode").value("U221045"))
                .andExpect(jsonPath("$[0].notes").value("Looking forward to attending!"))
                .andExpect(jsonPath("$[0].email").value("malika@turin.uz"));

        // 4. Admin edits event
        mockMvc.perform(put("/api/admin/events/" + eventId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "AI Innovation Summit 2026",
                                "description", "Updated agenda for the university AI conference.",
                                "category", "Technology",
                                "date", futureDate,
                                "time", "11:00",
                                "location", "The Annual Conference Hall",
                                "organizer", "CS Department",
                                "capacity", 80,
                                "status", "Upcoming",
                                "published", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("AI Innovation Summit 2026"))
                .andExpect(jsonPath("$.capacity").value(80));

        // 5. Unpublish hides event from public /api/events; Publish restores it
        mockMvc.perform(patch("/api/admin/events/" + eventId + "/unpublish")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published").value(false));

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        mockMvc.perform(patch("/api/admin/events/" + eventId + "/publish")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published").value(true));

        // 6. Student submits two hall applications
        MvcResult app1Res = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Robotics Showcase",
                                "eventType", "Conference",
                                "hallId", hallId,
                                "eventDate", futureDate,
                                "startTime", "10:00",
                                "endTime", "12:00",
                                "expectedParticipants", 100,
                                "description", "Showcase for robotics club."
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicantEmail").value("malika@turin.uz"))
                .andReturn();
        long app1Id = objectMapper.readTree(app1Res.getResponse().getContentAsString()).get("id").asLong();

        MvcResult app2Res = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Debate Club Finals",
                                "eventType", "Seminar",
                                "hallId", hallId,
                                "eventDate", LocalDate.now().plusDays(15).toString(),
                                "startTime", "14:00",
                                "endTime", "16:00",
                                "expectedParticipants", 60
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        long app2Id = objectMapper.readTree(app2Res.getResponse().getContentAsString()).get("id").asLong();

        // Admin received notifications for new applications
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(2));

        // Admin filters applications by applicant email
        mockMvc.perform(get("/api/admin/applications?search=malika@turin.uz")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));

        // Admin updates statuses directly (app1 -> APPROVED, app2 -> REJECTED)
        mockMvc.perform(patch("/api/admin/applications/" + app1Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "APPROVED",
                                "comment", "Approved for main conference hall."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mockMvc.perform(patch("/api/admin/applications/" + app2Id + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "status", "REJECTED",
                                "comment", "Conflicting academic schedule."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        // 7. Admin views user's complete application & event registration history
        mockMvc.perform(get("/api/admin/users/" + studentId + "/applications")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hallApplications.length()").value(2))
                .andExpect(jsonPath("$.eventRegistrations.length()").value(1));

        // 8. Dynamic analytics reflect exact DB counts
        mockMvc.perform(get("/api/admin/analytics")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEvents").value(2))
                .andExpect(jsonPath("$.upcomingEvents").value(1))
                .andExpect(jsonPath("$.completedEvents").value(1))
                .andExpect(jsonPath("$.totalUsers").value(2))
                .andExpect(jsonPath("$.totalApplications").value(2))
                .andExpect(jsonPath("$.approvedApplications").value(1))
                .andExpect(jsonPath("$.rejectedApplications").value(1))
                .andExpect(jsonPath("$.pendingApplications").value(0))
                .andExpect(jsonPath("$.approvalRatePercent").value(50.0))
                .andExpect(jsonPath("$.rejectionRatePercent").value(50.0))
                .andExpect(jsonPath("$.popularEvents.length()").value(2))
                .andExpect(jsonPath("$.monthlyApplicationTrends.length()").value(6));

        // 9. Admin cancels & deletes event, deletes application
        mockMvc.perform(patch("/api/admin/events/" + eventId + "/cancel")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Cancelled"));

        mockMvc.perform(delete("/api/admin/events/" + eventId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        assertThat(eventRepository.existsById(eventId)).isFalse();

        mockMvc.perform(delete("/api/admin/applications/" + app2Id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        assertThat(applicationRepository.existsById(app2Id)).isFalse();

        // 10. Activity logs captured all major admin actions
        mockMvc.perform(get("/api/admin/activity-logs")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(9)));
    }
}
