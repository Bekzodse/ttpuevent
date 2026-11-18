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
import uz.university.uems.entity.*;
import uz.university.uems.repository.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UpgradeFeaturesIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private EventHallRepository hallRepository;
    @Autowired private HallApplicationRepository applicationRepository;
    @Autowired private ApplicationHistoryRepository historyRepository;
    @Autowired private HallScheduleBlockRepository scheduleBlockRepository;
    @Autowired private EquipmentRepository equipmentRepository;
    @Autowired private EquipmentReservationRepository equipmentReservationRepository;
    @Autowired private CancellationPolicyRepository policyRepository;
    @Autowired private CancellationRequestRepository cancellationRepository;
    @Autowired private FinancialAuditLogRepository financialAuditRepository;
    @Autowired private UniversityBrandingRepository brandingRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private LoginActivityRepository loginActivityRepository;
    @Autowired private EventRegistrationRepository eventRegistrationRepository;
    @Autowired private UniversityEventRepository eventRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private EventHall hall;
    private Equipment projector;
    private String adminToken;
    private String user1Token;
    private String user2Token;

    @BeforeEach
    void setup() throws Exception {
        notificationRepository.deleteAll();
        financialAuditRepository.deleteAll();
        cancellationRepository.deleteAll();
        policyRepository.deleteAll();
        equipmentReservationRepository.deleteAll();
        historyRepository.deleteAll();
        scheduleBlockRepository.deleteAll();
        applicationRepository.deleteAll();
        eventRegistrationRepository.deleteAll();
        eventRepository.deleteAll();
        loginActivityRepository.deleteAll();
        equipmentRepository.deleteAll();
        hallRepository.deleteAll();
        brandingRepository.deleteAll();
        userRepository.deleteAll();

        userRepository.save(User.builder()
                .firstName("Admin").lastName("Root").phoneNumber("+998901000010")
                .username("upadmin").password(passwordEncoder.encode("Admin123!")).role(Role.ADMIN).active(true).build());
        userRepository.save(User.builder()
                .firstName("Ali").lastName("Karimov").phoneNumber("+998901000011")
                .username("userone").password(passwordEncoder.encode("Pass123!")).role(Role.USER).active(true).build());
        userRepository.save(User.builder()
                .firstName("Olim").lastName("Tursunov").phoneNumber("+998901000012")
                .username("usertwo").password(passwordEncoder.encode("Pass123!")).role(Role.USER).active(true).build());

        hall = hallRepository.save(EventHall.builder()
                .name("Grand Hall").building("Main").floor("1st").capacity(200)
                .hourlyRate(new BigDecimal("50.00")).active(true).build());

        projector = equipmentRepository.save(Equipment.builder()
                .name("4K Projector").category("Visual").totalQuantity(2)
                .unitFee(new BigDecimal("10.00")).active(true).build());

        adminToken = login("upadmin", "Admin123!");
        user1Token = login("userone", "Pass123!");
        user2Token = login("usertwo", "Pass123!");
    }

    private String login(String u, String p) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("username", u, "password", p))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void calendarBlocksAndSimultaneousBookingConflictPrevention() throws Exception {
        LocalDate date = LocalDate.now().plusDays(12);

        // Regular user cannot create schedule block
        mockMvc.perform(post("/api/admin/calendar/blocks")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "hallId", hall.getId(),
                                "blockDate", date.toString(),
                                "startTime", "08:00",
                                "endTime", "10:00",
                                "blockType", "MAINTENANCE",
                                "reason", "Audio setup"
                        ))))
                .andExpect(status().isForbidden());

        // Admin blocks 08:00-10:00
        MvcResult blockRes = mockMvc.perform(post("/api/admin/calendar/blocks")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "hallId", hall.getId(),
                                "blockDate", date.toString(),
                                "startTime", "08:00",
                                "endTime", "10:00",
                                "blockType", "MAINTENANCE",
                                "reason", "Audio calibration"
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        long blockId = objectMapper.readTree(blockRes.getResponse().getContentAsString()).get("id").asLong();

        // Calendar availability shows BLOCKED for 08:00-09:00 and AVAILABLE for 10:00-11:00
        mockMvc.perform(get("/api/calendar/availability")
                        .param("hallId", hall.getId().toString())
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slotState").value("BLOCKED"))
                .andExpect(jsonPath("$[2].slotState").value("AVAILABLE"));

        // Booking during blocked slot fails -> 409
        mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "Morning Seminar",
                                "eventType", "Seminar",
                                "hallId", hall.getId(),
                                "eventDate", date.toString(),
                                "startTime", "09:00",
                                "endTime", "11:00",
                                "expectedParticipants", 30
                        ))))
                .andExpect(status().isConflict());

        // Simultaneous concurrent requests with 2 equipment units requested twice (overbooking check!)
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch go = new CountDownLatch(1);

        Callable<Integer> task1 = () -> {
            ready.countDown();
            go.await();
            return mockMvc.perform(post("/api/applications")
                            .header("Authorization", "Bearer " + user1Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "eventName", "Simultaneous A",
                                    "eventType", "Conference",
                                    "hallId", hall.getId(),
                                    "eventDate", date.toString(),
                                    "startTime", "12:00",
                                    "endTime", "14:00",
                                    "expectedParticipants", 50,
                                    "equipmentItems", List.of(Map.of("equipmentId", projector.getId(), "quantity", 2))
                            ))))
                    .andReturn().getResponse().getStatus();
        };

        // Even on a second hall (or same hall), simultaneous request for same 2 projectors during 12:00-14:00
        EventHall hall2 = hallRepository.save(EventHall.builder()
                .name("Second Hall").building("East").floor("2nd").capacity(100)
                .hourlyRate(new BigDecimal("40.00")).active(true).build());

        Callable<Integer> task2 = () -> {
            ready.countDown();
            go.await();
            return mockMvc.perform(post("/api/applications")
                            .header("Authorization", "Bearer " + user2Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "eventName", "Simultaneous B",
                                    "eventType", "Workshop",
                                    "hallId", hall2.getId(),
                                    "eventDate", date.toString(),
                                    "startTime", "12:00",
                                    "endTime", "14:00",
                                    "expectedParticipants", 40,
                                    "equipmentItems", List.of(Map.of("equipmentId", projector.getId(), "quantity", 2))
                            ))))
                    .andReturn().getResponse().getStatus();
        };

        Future<Integer> f1 = pool.submit(task1);
        Future<Integer> f2 = pool.submit(task2);
        ready.await();
        go.countDown();

        List<Integer> statuses = new ArrayList<>();
        statuses.add(f1.get());
        statuses.add(f2.get());
        pool.shutdown();

        assertThat(statuses).containsExactlyInAnyOrder(201, 409);

        // Delete schedule block
        mockMvc.perform(delete("/api/admin/calendar/blocks/" + blockId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void equipmentManagementCancellationRefundAndBrandingWorkflow() throws Exception {
        LocalDate date = LocalDate.now().plusDays(15);

        // 1. Admin creates new equipment & views list
        MvcResult eqRes = mockMvc.perform(post("/api/admin/equipment")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Wireless Mic Set",
                                "category", "Audio",
                                "description", "Dual mics",
                                "totalQuantity", 5,
                                "unitFee", 5.00,
                                "active", true
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        long micId = objectMapper.readTree(eqRes.getResponse().getContentAsString()).get("id").asLong();

        // 2. User submits application requesting 2 projectors & 2 mics
        MvcResult appRes = mockMvc.perform(post("/api/applications")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "eventName", "University Tech Fest",
                                "eventType", "Conference",
                                "hallId", hall.getId(),
                                "eventDate", date.toString(),
                                "startTime", "10:00",
                                "endTime", "12:00",
                                "expectedParticipants", 120,
                                "equipmentItems", List.of(
                                        Map.of("equipmentId", projector.getId(), "quantity", 2),
                                        Map.of("equipmentId", micId, "quantity", 2)
                                )
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.equipmentReservations.length()").value(2))
                .andExpect(jsonPath("$.requiredAmount").value(130.00)) // 2*50 + 2*10 + 2*5
                .andReturn();
        JsonNode appJson = objectMapper.readTree(appRes.getResponse().getContentAsString());
        long appId = appJson.get("id").asLong();
        long projResId = appJson.get("equipmentReservations").get(0).get("id").asLong();

        // Admin approves equipment reservation
        mockMvc.perform(post("/api/admin/applications/" + appId + "/equipment/" + projResId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Approve app -> upload receipt -> confirm payment
        mockMvc.perform(post("/api/admin/applications/" + appId + "/approve")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        byte[] validPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        mockMvc.perform(multipart("/api/applications/" + appId + "/receipt")
                        .file(new MockMultipartFile("file", "rec.png", "image/png", validPng))
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/admin/applications/" + appId + "/approve-payment")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Calendar shows CONFIRMED in date range
        mockMvc.perform(get("/api/calendar")
                        .param("startDate", date.toString())
                        .param("endDate", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.events[0].slotState").value("CONFIRMED"));

        // 3. Cancellation & Refund workflow (event is 15 days away -> 100% eligible refund)
        MvcResult cancelRes = mockMvc.perform(post("/api/applications/" + appId + "/cancellation-request")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Keynote speaker rescheduled to next semester.\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.refundStatus").value("PENDING_VERIFICATION"))
                .andExpect(jsonPath("$.eligibleRefundPercent").value(100))
                .andExpect(jsonPath("$.eligibleRefundAmount").value(130.00))
                .andReturn();
        long cancelId = objectMapper.readTree(cancelRes.getResponse().getContentAsString()).get("id").asLong();

        // Admin approves cancellation -> booking becomes CANCELLED & equipment RELEASED, refund stays PENDING_VERIFICATION
        mockMvc.perform(post("/api/admin/cancellations/" + cancelId + "/approve")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\": \"Approved cancellation per 48h+ policy.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.bookingStatus").value("CANCELLED"))
                .andExpect(jsonPath("$.refundStatus").value("PENDING_VERIFICATION"));

        // Regular user cannot complete refund -> 403
        mockMvc.perform(post("/api/admin/cancellations/" + cancelId + "/complete-refund")
                        .header("Authorization", "Bearer " + user1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refundAmount\": 130.00, \"transactionRef\": \"TX-999\"}"))
                .andExpect(status().isForbidden());

        // Admin completes refund with bank transaction reference
        mockMvc.perform(post("/api/admin/cancellations/" + cancelId + "/complete-refund")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refundAmount\": 130.00, \"transactionRef\": \"REF-2026-8812\", \"adminComment\": \"Bank transfer sent.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refundStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.approvedRefundAmount").value(130.00))
                .andExpect(jsonPath("$.refundTransactionRef").value("REF-2026-8812"));

        // Financial audit log records everything
        mockMvc.perform(get("/api/admin/financial-audit")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(4)));

        // Equipment is now released & available again (2/2)!
        mockMvc.perform(get("/api/equipment")
                        .param("date", date.toString())
                        .param("startTime", "10:00")
                        .param("endTime", "12:00"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].availableQuantity").value(2));

        // 4. Branding customization & logo upload
        mockMvc.perform(get("/api/branding"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.universityName").isNotEmpty());

        mockMvc.perform(put("/api/admin/branding")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "universityName", "Tashkent Tech University",
                                "universitySubtitle", "Smart Campus Portal",
                                "loginHeadline", "Sign in to Tashkent Tech",
                                "loginDescription", "Official campus system.",
                                "primaryColor", "#0f766e",
                                "secondaryColor", "#0284c7",
                                "contactEmail", "info@ttu.uz",
                                "contactPhone", "+998712345678",
                                "contactAddress", "Amir Temur 108",
                                "websiteUrl", "https://ttu.uz"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.universityName").value("Tashkent Tech University"))
                .andExpect(jsonPath("$.primaryColor").value("#0f766e"));

        mockMvc.perform(multipart("/api/admin/branding/logo")
                        .file(new MockMultipartFile("file", "logo.png", "image/png", validPng))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoUrl").isNotEmpty());
    }
}
