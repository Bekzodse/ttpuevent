package uz.university.uems.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.entity.CancellationPolicy;
import uz.university.uems.entity.Equipment;
import uz.university.uems.entity.EventHall;
import uz.university.uems.entity.LoginActivity;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.UniversityBranding;
import uz.university.uems.entity.UniversityEvent;
import uz.university.uems.entity.User;
import uz.university.uems.repository.CancellationPolicyRepository;
import uz.university.uems.repository.EquipmentRepository;
import uz.university.uems.repository.EventHallRepository;
import uz.university.uems.repository.LoginActivityRepository;
import uz.university.uems.repository.UniversityBrandingRepository;
import uz.university.uems.repository.UniversityEventRepository;
import uz.university.uems.repository.UserRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final LoginActivityRepository loginActivityRepository;
    private final UniversityEventRepository eventRepository;
    private final EventHallRepository hallRepository;
    private final EquipmentRepository equipmentRepository;
    private final CancellationPolicyRepository cancellationPolicyRepository;
    private final UniversityBrandingRepository brandingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() == 0) {
            Instant now = Instant.now();

            User admin = userRepository.save(User.builder()
                    .firstName("Bekzod")
                    .lastName("Admin")
                    .phoneNumber("+998901000001")
                    .username("Bekzod")
                    .password(passwordEncoder.encode("Bekzodse"))
                    .role(Role.ADMIN)
                    .department("University Administration")
                    .bio("Chief System Administrator for the University Management Portal.")
                    .active(true)
                    .lastLoginAt(now.minus(2, ChronoUnit.HOURS))
                    .lastActivityAt(now.minus(1, ChronoUnit.HOURS))
                    .build());

            User student1 = userRepository.save(User.builder()
                    .firstName("Malika")
                    .lastName("Yusupova")
                    .phoneNumber("+998901234567")
                    .username("malika")
                    .password(passwordEncoder.encode("Student123!"))
                    .role(Role.USER)
                    .department("Computer Science")
                    .bio("3rd-year Computer Science student interested in AI and campus tech clubs.")
                    .active(true)
                    .lastLoginAt(now.minus(5, ChronoUnit.MINUTES))
                    .lastActivityAt(now.minus(3, ChronoUnit.MINUTES))
                    .build());

            User student2 = userRepository.save(User.builder()
                    .firstName("Jasur")
                    .lastName("Toshmatov")
                    .phoneNumber("+998902345678")
                    .username("jasur")
                    .password(passwordEncoder.encode("Student123!"))
                    .role(Role.USER)
                    .department("Software Engineering")
                    .bio("Backend enthusiast and university football team captain.")
                    .active(true)
                    .lastLoginAt(now.minus(1, ChronoUnit.DAYS))
                    .lastActivityAt(now.minus(1, ChronoUnit.DAYS))
                    .build());

            User student3 = userRepository.save(User.builder()
                    .firstName("Dilnoza")
                    .lastName("Karimova")
                    .phoneNumber("+998903456789")
                    .username("dilnoza")
                    .password(passwordEncoder.encode("Student123!"))
                    .role(Role.USER)
                    .department("Economics & Management")
                    .bio("Undergraduate student and Career Center ambassador.")
                    .active(false)
                    .build());

            loginActivityRepository.saveAll(List.of(
                    LoginActivity.builder().user(admin).loginTime(now.minus(2, ChronoUnit.HOURS)).ipAddress("127.0.0.1").userAgent("System Seed").successful(true).build(),
                    LoginActivity.builder().user(student1).loginTime(now.minus(5, ChronoUnit.MINUTES)).ipAddress("127.0.0.1").userAgent("System Seed").successful(true).build(),
                    LoginActivity.builder().user(student2).loginTime(now.minus(1, ChronoUnit.DAYS)).ipAddress("127.0.0.1").userAgent("System Seed").successful(true).build()
            ));

            log.info("Seeded default university users.");
        }

        // Ensure primary secret admin account uses Bekzod / Bekzodse
        userRepository.findByUsernameIgnoreCase("Bekzod").ifPresentOrElse(
                bekzod -> {
                    bekzod.setRole(Role.ADMIN);
                    bekzod.setActive(true);
                    if (!passwordEncoder.matches("Bekzodse", bekzod.getPassword())) {
                        bekzod.setPassword(passwordEncoder.encode("Bekzodse"));
                    }
                    userRepository.save(bekzod);
                },
                () -> userRepository.findByUsernameIgnoreCase("admin").ifPresent(oldAdmin -> {
                    oldAdmin.setUsername("Bekzod");
                    oldAdmin.setFirstName("Bekzod");
                    oldAdmin.setPassword(passwordEncoder.encode("Bekzodse"));
                    oldAdmin.setRole(Role.ADMIN);
                    oldAdmin.setActive(true);
                    userRepository.save(oldAdmin);
                })
        );

        if (eventRepository.count() == 0) {
            eventRepository.saveAll(List.of(
                    UniversityEvent.builder()
                            .title("Hackathon 2026: Smart Campus")
                            .description("24-hour university hackathon where student teams build digital solutions to improve campus life. Winning teams receive prizes and internship offers.")
                            .category("Technology")
                            .eventDate(LocalDate.of(2026, 12, 5))
                            .eventTime("09:00")
                            .location("Yellow Hall")
                            .organizer("Department of Computer Science")
                            .capacity(150)
                            .registeredCount(112)
                            .gradient("from-indigo-500 to-purple-600")
                            .status("Upcoming")
                            .build(),
                    UniversityEvent.builder()
                            .title("University Career Day & Job Fair")
                            .description("Meet representatives from leading tech and engineering companies, attend CV review workshops, and join on-site interviews.")
                            .category("Career")
                            .eventDate(LocalDate.of(2026, 12, 12))
                            .eventTime("10:00")
                            .location("The Annual Conference Hall")
                            .organizer("University Career Center")
                            .capacity(250)
                            .registeredCount(210)
                            .gradient("from-emerald-500 to-teal-600")
                            .status("Upcoming")
                            .build(),
                    UniversityEvent.builder()
                            .title("Inter-University Football Cup")
                            .description("Annual inter-university football championship. Register your faculty squad and compete for the university trophy.")
                            .category("Sports")
                            .eventDate(LocalDate.of(2026, 11, 28))
                            .eventTime("14:00")
                            .location("Central Stadium")
                            .organizer("University Sports Club")
                            .capacity(200)
                            .registeredCount(190)
                            .gradient("from-orange-500 to-red-500")
                            .status("Upcoming")
                            .build(),
                    UniversityEvent.builder()
                            .title("International AI Research Symposium")
                            .description("Keynote lectures and panel discussions on recent breakthroughs in Artificial Intelligence, machine learning, and academic ethics.")
                            .category("Academic")
                            .eventDate(LocalDate.of(2026, 12, 18))
                            .eventTime("11:00")
                            .location("Green Hall")
                            .organizer("Research & Innovation Office")
                            .capacity(140)
                            .registeredCount(96)
                            .gradient("from-sky-500 to-blue-600")
                            .status("Upcoming")
                            .build(),
                    UniversityEvent.builder()
                            .title("Campus Cultural Gala Night")
                            .description("An evening of music, traditional dance, and student creative showcases celebrating university diversity.")
                            .category("Cultural")
                            .eventDate(LocalDate.of(2026, 11, 24))
                            .eventTime("17:00")
                            .location("The Annual Conference Hall")
                            .organizer("Student Union")
                            .capacity(250)
                            .registeredCount(225)
                            .gradient("from-pink-500 to-rose-500")
                            .status("Upcoming")
                            .build(),
                    UniversityEvent.builder()
                            .title("Student Short Film Festival")
                            .description("Screening of original short films directed by university media club students followed by a Q&A session.")
                            .category("Arts & Media")
                            .eventDate(LocalDate.of(2026, 11, 10))
                            .eventTime("19:00")
                            .location("Yellow Hall")
                            .organizer("Campus Media Club")
                            .capacity(120)
                            .registeredCount(120)
                            .gradient("from-violet-500 to-fuchsia-500")
                            .status("Completed")
                            .build()
            ));
        }

        if (hallRepository.count() == 0) {
            hallRepository.saveAll(List.of(
                    EventHall.builder()
                            .name("The Annual Conference Hall")
                            .building("Main Building")
                            .floor("1st Floor")
                            .capacity(250)
                            .hourlyRate(new BigDecimal("70.00"))
                            .amenities("Tiered Blue Auditorium Seating, Podium & Stage, Dual Projectors, Surround Audio, Live Stream Rig")
                            .description("TTPU flagship conference auditorium suited for international conferences, plenary assemblies, graduations, and keynote symposiums.")
                            .imageUrl("/halls/annual-conference-hall.jpg")
                            .active(true)
                            .build(),
                    EventHall.builder()
                            .name("Green Hall")
                            .building("Academic Building")
                            .floor("2nd Floor")
                            .capacity(140)
                            .hourlyRate(new BigDecimal("45.00"))
                            .amenities("Tiered Green Amphitheater Seating, Wooden Lecturer Desk, Wireless Microphones, HD Projection")
                            .description("Modern amphitheater-style academic hall ideal for engineering lectures, faculty seminars, thesis defenses, and club meetings.")
                            .imageUrl("/halls/green-hall.jpg")
                            .active(true)
                            .build(),
                    EventHall.builder()
                            .name("Yellow Hall")
                            .building("Academic Building")
                            .floor("3rd Floor")
                            .capacity(120)
                            .hourlyRate(new BigDecimal("40.00"))
                            .amenities("Tiered Acoustic Auditorium, Podium Sound System, Smart Display, High-Speed Wi-Fi")
                            .description("Bright modern lecture and presentation hall tailored for workshops, startup pitch days, guest talks, and student events.")
                            .imageUrl("/halls/yellow-hall.jpg")
                            .active(true)
                            .build()
            ));
            log.info("Seeded 3 TTPU university event halls.");
        }

        if (equipmentRepository.count() == 0) {
            equipmentRepository.saveAll(List.of(
                    Equipment.builder().name("4K Laser Projector").category("Visual").description("High-lumen 4K laser projector with HDMI/USB-C connections.").totalQuantity(6).unitFee(new BigDecimal("10.00")).active(true).build(),
                    Equipment.builder().name("Wireless Handheld Microphone").category("Audio").description("UHF dual-channel wireless microphone with receiver.").totalQuantity(12).unitFee(new BigDecimal("5.00")).active(true).build(),
                    Equipment.builder().name("JBL Active Speakers (Pair)").category("Audio").description("Portable 1000W PA speaker system with stands.").totalQuantity(4).unitFee(new BigDecimal("15.00")).active(true).build(),
                    Equipment.builder().name("Presenter Laptop (Core i7)").category("Computing").description("15-inch presentation laptop with clicker remote.").totalQuantity(8).unitFee(new BigDecimal("8.00")).active(true).build(),
                    Equipment.builder().name("Modular LED Display Screen").category("Visual").description("75-inch 4K mobile LED display panel on rolling stand.").totalQuantity(3).unitFee(new BigDecimal("25.00")).active(true).build(),
                    Equipment.builder().name("Logitech 4K Conference Camera").category("Streaming").description("PTZ conference camera for hybrid lectures & livestreaming.").totalQuantity(4).unitFee(new BigDecimal("12.00")).active(true).build(),
                    Equipment.builder().name("Magnetic Mobile Whiteboard").category("Furniture").description("Double-sided magnetic whiteboard with markers and erasers.").totalQuantity(10).unitFee(BigDecimal.ZERO).active(true).build()
            ));
            log.info("Seeded 7 university equipment inventory items.");
        }

        if (cancellationPolicyRepository.count() == 0) {
            cancellationPolicyRepository.save(CancellationPolicy.builder()
                    .name("Standard University Cancellation Policy")
                    .fullRefundHoursBefore(48)
                    .partialRefundHoursBefore(24)
                    .partialRefundPercent(50)
                    .releaseHallOnApproval(true)
                    .description("100% refund if cancelled 48+ hours before event; 50% refund between 24–48 hours; 0% under 24 hours.")
                    .active(true)
                    .build());
        }

        if (brandingRepository.count() == 0) {
            brandingRepository.save(UniversityBranding.builder()
                    .universityName("Turin Polytechnic University in Tashkent")
                    .universitySubtitle("Students' Union · Event & Hall Portal")
                    .loginHeadline("Welcome to Turin Polytechnic University in Tashkent")
                    .loginDescription("Sign in with your university account to book campus event halls, reserve equipment, track payments, and manage university events.")
                    .primaryColor("#1d3b8b")
                    .secondaryColor("#3668b2")
                    .contactEmail("info@polito.uz")
                    .contactPhone("+998 71 246-80-51")
                    .contactAddress("17 Little Ring Road, Almazar District, Tashkent 100095")
                    .websiteUrl("https://turin.uz")
                    .build());
        }
    }
}
