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
import uz.university.uems.entity.BookingStatus;
import uz.university.uems.entity.EventHall;
import uz.university.uems.entity.HallApplication;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.User;
import uz.university.uems.repository.*;
import uz.university.uems.service.HallApplicationService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HallBookingIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private EventHallRepository hallRepository;
    @Autowired private HallApplicationRepository applicationRepository;
    @Autowired private ApplicationHistoryRepository historyRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private CancellationRequestRepository cancellationRequestRepository;
    @Autowired private EquipmentReservationRepository equipmentReservationRepository;
    @Autowired private HallScheduleBlockRepository scheduleBlockRepository;
    @Autowired private LoginActivityRepository loginActivityRepository;
    @Autowired private EventRegistrationRepository eventRegistrationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private HallApplicationService applicationService;

    private EventHall hall;
    private String adminToken;
    private String student1Token;
    private String student2Token;

    @BeforeEach
    void setup() throws Exception {
        notificationRepository.deleteAll();
        cancellationRequestRepository.deleteAll();
        equipmentReservationRepository.deleteAll();
        historyRepository.deleteAll();
        scheduleBlockRepository.deleteAll();
        applicationRepository.deleteAll();
        eventRegistrationRepository.deleteAll();
        loginActivityRepository.deleteAll();
        hallRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(User.builder()
                .firstName("Admin")
                .lastName("Rakhimov")
                .phoneNumber("+998901000001")
                .username("halladmin")
                .password(passwordEncoder.encode("Admin123!"))
                .role(Role.ADMIN)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .firstName("Malika")
                .lastName("Yusupova")
                .phoneNumber("+998901234567")
                .username("student1")
                .password(passwordEncoder.encode("Student123!"))
                .role(Role.USER)
                .active(true)
                .build());

        userRepository.save(User.builder()
                .firstName("Jasur")
                .lastName("Toshmatov")
                .phoneNumber("+998902345678")
                .username("student2")
                .password(passwordEncoder.encode("Student123!"))
                .role(Role.USER)
                .active(true)
                .build());

        hall = hallRepository.save(EventHall.builder()
                .name("Main Conference Hall")
                .building("Academic Building 1")
                .floor("2nd Floor")
                .capacity(100)
                .hourlyRate(new BigDecimal("50.00"))
                .amenities("Projector, Sound System")
                .active(true)
                .build());

        adminToken = login("halladmin", "Admin123!");
        student1Token = login("student1", "Student123!");
        student2Token = login("student2", "Student123!");
    }

    private String login(String username, String password) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", username, "password", password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void fullHallBookingApprovalPaymentPdfAndOverlapPreventionWorkflow() throws Exception {
        LocalDate eventDate = LocalDate.now().plusDays(10);

        // 1. Validation: capacity exceeded & invalid time range
        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Oversized Conference",
                                "eventType", "Conference",
                                "hallId", hall.getId(),
                                "eventDate", eventDate.toString(),
                                "startTime", "14:00",
                                "endTime", "13:00",
                                "expectedParticipants", 50
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Oversized Conference",
                                "eventType", "Conference",
                                "hallId", hall.getId(),
                                "eventDate", eventDate.toString(),
                                "startTime", "10:00",
                                "endTime", "12:00",
                                "expectedParticipants", 250
                        ))))
                .andExpect(status().isBadRequest());

        // 2. Student 1 submits valid application (profile auto-populated, no Student ID required)
        MvcResult app1Res = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "AI Innovation Seminar",
                                "eventType", "Seminar",
                                "hallId", hall.getId(),
                                "eventDate", eventDate.toString(),
                                "startTime", "10:00",
                                "endTime", "12:00",
                                "expectedParticipants", 80,
                                "description", "Annual student AI research talks."
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.applicationCode").isNotEmpty())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.applicantFirstName").value("Malika"))
                .andExpect(jsonPath("$.applicantLastName").value("Yusupova"))
                .andExpect(jsonPath("$.applicantPhoneNumber").value("+998901234567"))
                .andExpect(jsonPath("$.requiredAmount").value(100.00))
                .andReturn();

        JsonNode app1Json = objectMapper.readTree(app1Res.getResponse().getContentAsString());
        long app1Id = app1Json.get("id").asLong();

        // Student 2 also submits overlapping application while app1 is still PENDING
        MvcResult app2Res = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + student2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Robotics Meetup",
                                "eventType", "Meeting",
                                "hallId", hall.getId(),
                                "eventDate", eventDate.toString(),
                                "startTime", "11:00",
                                "endTime", "13:00",
                                "expectedParticipants", 40
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        long app2Id = objectMapper.readTree(app2Res.getResponse().getContentAsString()).get("id").asLong();

        // Regular user cannot access admin applications API -> 403
        mockMvc.perform(get("/api/admin/applications")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        // 3. Admin requests additional info on app1 -> UNDER_REVIEW -> student1 replies -> PENDING
        mockMvc.perform(post("/api/admin/applications/" + app1Id + "/request-info")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \"Please confirm projector and microphone requirements.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));

        mockMvc.perform(post("/api/applications/" + app1Id + "/reply")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reply\": \"We need 2 wireless mics and HDMI projector.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.userReply").value("We need 2 wireless mics and HDMI projector."));

        // 4. Admin approves app1 -> status becomes PAYMENT_PENDING with 24h temporary hold & bank card details
        mockMvc.perform(post("/api/admin/applications/" + app1Id + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \"Approved for Main Conference Hall.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_PENDING"))
                .andExpect(jsonPath("$.paymentStatus").value("PAYMENT_PENDING"))
                .andExpect(jsonPath("$.bankCardNumber").isNotEmpty())
                .andExpect(jsonPath("$.paymentDeadline").isNotEmpty());

        // 5. Overlap check: Admin CANNOT approve overlapping app2 while app1 holds 24h reservation -> 409 Conflict
        mockMvc.perform(post("/api/admin/applications/" + app2Id + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict());

        // Admin rejects app2 with reason
        mockMvc.perform(post("/api/admin/applications/" + app2Id + "/reject")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \"Time slot already reserved by another seminar.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        // 6. Invalid receipt rejected (fake PNG)
        MockMultipartFile fakeReceipt = new MockMultipartFile(
                "file", "fake.png", "image/png", "bad-bytes".getBytes());
        mockMvc.perform(multipart("/api/applications/" + app1Id + "/receipt")
                        .file(fakeReceipt)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isBadRequest());

        // 7. Valid PNG receipt uploaded -> PAYMENT_UNDER_REVIEW
        byte[] validPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile realReceipt = new MockMultipartFile(
                "file", "receipt.png", "image/png", validPng);
        MvcResult receiptRes = mockMvc.perform(multipart("/api/applications/" + app1Id + "/receipt")
                        .file(realReceipt)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_UNDER_REVIEW"))
                .andExpect(jsonPath("$.paymentStatus").value("PAYMENT_UNDER_REVIEW"))
                .andExpect(jsonPath("$.receiptUrl").isNotEmpty())
                .andReturn();

        String receiptUrl = objectMapper.readTree(receiptRes.getResponse().getContentAsString())
                .get("receiptUrl").asText();

        // Receipt access RBAC: student2 gets 403, admin gets 200
        mockMvc.perform(get(receiptUrl).header("Authorization", "Bearer " + student2Token))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(receiptUrl).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // 8. Admin rejects payment -> PAYMENT_REJECTED, student re-uploads -> PAYMENT_UNDER_REVIEW, admin approves -> CONFIRMED
        mockMvc.perform(post("/api/admin/applications/" + app1Id + "/reject-payment")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \"Transaction reference not visible.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_REJECTED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAYMENT_REJECTED"));

        mockMvc.perform(multipart("/api/applications/" + app1Id + "/receipt")
                        .file(realReceipt)
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_UNDER_REVIEW"));

        mockMvc.perform(post("/api/admin/applications/" + app1Id + "/approve-payment")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \"Bank transfer #99412 verified.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAYMENT_APPROVED"))
                .andExpect(jsonPath("$.confirmedAt").isNotEmpty())
                .andExpect(jsonPath("$.history").isArray());

        // 9. PDF Booking Confirmation download
        MvcResult pdfRes = mockMvc.perform(get("/api/applications/" + app1Id + "/confirmation-pdf")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();
        byte[] pdfBytes = pdfRes.getResponse().getContentAsByteArray();
        assertThat(pdfBytes.length).isGreaterThan(500);
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");

        // 10. Notifications persisted for student1
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(5)));
    }

    @Test
    void unpaidReservationAutomaticallyExpiresAfterDeadlineAndReleasesSlot() throws Exception {
        LocalDate eventDate = LocalDate.now().plusDays(15);

        // Submit & approve application 1
        MvcResult app1Res = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Workshop A",
                                "eventType", "Workshop",
                                "hallId", hall.getId(),
                                "eventDate", eventDate.toString(),
                                "startTime", "10:00",
                                "endTime", "12:00",
                                "expectedParticipants", 30
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        long app1Id = objectMapper.readTree(app1Res.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(post("/api/admin/applications/" + app1Id + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_PENDING"));

        // Force deadline into the past to simulate 24 hours elapsed
        HallApplication app1 = applicationRepository.findById(app1Id).orElseThrow();
        app1.setPaymentDeadline(Instant.now().minus(1, ChronoUnit.HOURS));
        applicationRepository.save(app1);

        int expiredCount = applicationService.expireOverdueReservations();
        assertThat(expiredCount).isEqualTo(1);

        HallApplication refreshed = applicationRepository.findById(app1Id).orElseThrow();
        assertThat(refreshed.getStatus()).isEqualTo(BookingStatus.EXPIRED);

        // Slot is now free for student2!
        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + student2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Workshop B",
                                "eventType", "Workshop",
                                "hallId", hall.getId(),
                                "eventDate", eventDate.toString(),
                                "startTime", "10:00",
                                "endTime", "12:00",
                                "expectedParticipants", 40
                        ))))
                .andExpect(status().isCreated());
    }
}
