package uz.university.uems.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.*;
import uz.university.uems.entity.*;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final DateTimeFormatter MONTH_LABEL_FMT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

    private final UserRepository userRepository;
    private final LoginActivityRepository loginActivityRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final UniversityEventRepository eventRepository;
    private final HallApplicationRepository hallApplicationRepository;
    private final EventHallRepository eventHallRepository;
    private final ApplicationHistoryRepository applicationHistoryRepository;
    private final EquipmentReservationRepository equipmentReservationRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final NotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;
    private final AdminActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public AdminStatsDto getStats() {
        Instant onlineCutoff = Instant.now().minus(15, ChronoUnit.MINUTES);
        long pending = hallApplicationRepository.countByStatus(BookingStatus.PENDING)
                + hallApplicationRepository.countByStatus(BookingStatus.UNDER_REVIEW);
        long approved = hallApplicationRepository.countByStatus(BookingStatus.APPROVED)
                + hallApplicationRepository.countByStatus(BookingStatus.PAYMENT_PENDING)
                + hallApplicationRepository.countByStatus(BookingStatus.PAYMENT_UNDER_REVIEW)
                + hallApplicationRepository.countByStatus(BookingStatus.PAYMENT_APPROVED)
                + hallApplicationRepository.countByStatus(BookingStatus.CONFIRMED);
        long rejected = hallApplicationRepository.countByStatus(BookingStatus.REJECTED)
                + hallApplicationRepository.countByStatus(BookingStatus.PAYMENT_REJECTED);

        return AdminStatsDto.builder()
                .totalUsers(userRepository.count())
                .activeAccounts(userRepository.countByActiveTrue())
                .inactiveAccounts(userRepository.countByActiveFalse())
                .currentlyActiveUsers(userRepository.countByActiveTrueAndLastActivityAtAfter(onlineCutoff))
                .usersWhoLoggedIn(userRepository.countByLastLoginAtIsNotNull())
                .totalAdmins(userRepository.countByRole(Role.ADMIN))
                .totalRegularUsers(userRepository.countByRole(Role.USER))
                .totalEvents(eventRepository.count())
                .upcomingEvents(eventRepository.countByStatusIgnoreCase("Upcoming"))
                .completedEvents(eventRepository.countByStatusIgnoreCase("Completed"))
                .totalEventRegistrations(eventRegistrationRepository.count())
                .totalApplications(hallApplicationRepository.count())
                .pendingApplications(pending)
                .approvedApplications(approved)
                .rejectedApplications(rejected)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsDto getAnalytics() {
        Instant onlineCutoff = Instant.now().minus(15, ChronoUnit.MINUTES);

        List<UniversityEvent> allEvents = eventRepository.findAllByOrderByEventDateAsc();
        List<HallApplication> allApps = hallApplicationRepository.findAllByOrderByCreatedAtDesc();
        List<EventHall> allHalls = eventHallRepository.findAll();

        long upcomingEvents = allEvents.stream().filter(e -> "Upcoming".equalsIgnoreCase(e.getStatus())).count();
        long completedEvents = allEvents.stream().filter(e -> "Completed".equalsIgnoreCase(e.getStatus())).count();
        long cancelledEvents = allEvents.stream().filter(e -> "Cancelled".equalsIgnoreCase(e.getStatus())).count();
        long draftEvents = allEvents.stream().filter(e -> "Draft".equalsIgnoreCase(e.getStatus())).count();
        long publishedEvents = allEvents.stream().filter(UniversityEvent::isPublished).count();

        long totalEventCapacity = allEvents.stream().mapToLong(UniversityEvent::getCapacity).sum();
        long totalEventRegistered = allEvents.stream().mapToLong(UniversityEvent::getRegisteredCount).sum();
        double eventFillRate = totalEventCapacity > 0
                ? round1(totalEventRegistered * 100.0 / totalEventCapacity)
                : 0.0;

        long totalApps = allApps.size();
        long pendingApps = 0;
        long approvedApps = 0;
        long rejectedApps = 0;
        long cancelledApps = 0;
        long expiredApps = 0;
        long confirmedApps = 0;
        BigDecimal confirmedRevenue = BigDecimal.ZERO;

        Map<BookingStatus, Long> rawStatusCounts = new EnumMap<>(BookingStatus.class);
        for (BookingStatus bs : BookingStatus.values()) {
            rawStatusCounts.put(bs, 0L);
        }

        // Monthly trend buckets: pre-seed last 6 months up to current month
        YearMonth nowYm = YearMonth.now(ZoneOffset.UTC);
        Map<YearMonth, long[]> monthlyMap = new TreeMap<>();
        for (int i = 5; i >= 0; i--) {
            monthlyMap.put(nowYm.minusMonths(i), new long[5]); // [total, approved, rejected, pending, cancelled]
        }

        Map<Long, long[]> hallCounts = new HashMap<>(); // [total, confirmed]
        Map<Long, BigDecimal> hallRevenue = new HashMap<>();

        for (HallApplication app : allApps) {
            BookingStatus st = app.getStatus();
            rawStatusCounts.merge(st, 1L, Long::sum);

            boolean isPending = st == BookingStatus.PENDING || st == BookingStatus.UNDER_REVIEW;
            boolean isApproved = st == BookingStatus.APPROVED
                    || st == BookingStatus.PAYMENT_PENDING
                    || st == BookingStatus.PAYMENT_UNDER_REVIEW
                    || st == BookingStatus.PAYMENT_APPROVED
                    || st == BookingStatus.CONFIRMED;
            boolean isRejected = st == BookingStatus.REJECTED || st == BookingStatus.PAYMENT_REJECTED;
            boolean isCancelled = st == BookingStatus.CANCELLED;
            boolean isExpired = st == BookingStatus.EXPIRED;

            if (isPending) pendingApps++;
            if (isApproved) approvedApps++;
            if (isRejected) rejectedApps++;
            if (isCancelled) cancelledApps++;
            if (isExpired) expiredApps++;
            if (st == BookingStatus.CONFIRMED) {
                confirmedApps++;
                if (app.getRequiredAmount() != null) {
                    confirmedRevenue = confirmedRevenue.add(app.getRequiredAmount());
                }
            }

            if (app.getCreatedAt() != null) {
                YearMonth ym = YearMonth.from(app.getCreatedAt().atZone(ZoneOffset.UTC));
                long[] counts = monthlyMap.computeIfAbsent(ym, k -> new long[5]);
                counts[0]++;
                if (isApproved) counts[1]++;
                else if (isRejected) counts[2]++;
                else if (isPending) counts[3]++;
                else if (isCancelled) counts[4]++;
            }

            Long hId = app.getHall().getId();
            long[] hc = hallCounts.computeIfAbsent(hId, k -> new long[2]);
            hc[0]++;
            if (st == BookingStatus.CONFIRMED) {
                hc[1]++;
                if (app.getRequiredAmount() != null) {
                    hallRevenue.merge(hId, app.getRequiredAmount(), BigDecimal::add);
                }
            }
        }

        long decided = approvedApps + rejectedApps;
        double approvalRate = decided > 0 ? round1(approvedApps * 100.0 / decided) : 0.0;
        double rejectionRate = decided > 0 ? round1(rejectedApps * 100.0 / decided) : 0.0;
        double cancellationRate = totalApps > 0 ? round1(cancelledApps * 100.0 / totalApps) : 0.0;

        List<AdminAnalyticsDto.StatusCountItem> statusBreakdown = List.of(
                new AdminAnalyticsDto.StatusCountItem("PENDING", "Pending Review", pendingApps),
                new AdminAnalyticsDto.StatusCountItem("APPROVED", "Approved / In Payment", approvedApps - confirmedApps),
                new AdminAnalyticsDto.StatusCountItem("CONFIRMED", "Confirmed", confirmedApps),
                new AdminAnalyticsDto.StatusCountItem("REJECTED", "Rejected", rejectedApps),
                new AdminAnalyticsDto.StatusCountItem("CANCELLED", "Cancelled", cancelledApps),
                new AdminAnalyticsDto.StatusCountItem("EXPIRED", "Expired", expiredApps)
        );

        // Keep at most last 12 months sorted chronologically
        List<YearMonth> sortedMonths = new ArrayList<>(monthlyMap.keySet());
        if (sortedMonths.size() > 12) {
            sortedMonths = sortedMonths.subList(sortedMonths.size() - 12, sortedMonths.size());
        }
        List<AdminAnalyticsDto.MonthlyTrendItem> monthlyTrends = sortedMonths.stream()
                .map(ym -> {
                    long[] c = monthlyMap.get(ym);
                    return AdminAnalyticsDto.MonthlyTrendItem.builder()
                            .month(ym.toString())
                            .label(ym.format(MONTH_LABEL_FMT))
                            .total(c[0])
                            .approved(c[1])
                            .rejected(c[2])
                            .pending(c[3])
                            .cancelled(c[4])
                            .build();
                })
                .toList();

        // Category participation
        Map<String, long[]> catMap = new LinkedHashMap<>();
        for (UniversityEvent ev : allEvents) {
            long[] arr = catMap.computeIfAbsent(ev.getCategory(), k -> new long[3]);
            arr[0]++;
            arr[1] += ev.getCapacity();
            arr[2] += ev.getRegisteredCount();
        }
        List<AdminAnalyticsDto.CategoryParticipationItem> categoryParticipation = catMap.entrySet().stream()
                .map(e -> {
                    long cap = e.getValue()[1];
                    long reg = e.getValue()[2];
                    return AdminAnalyticsDto.CategoryParticipationItem.builder()
                            .category(e.getKey())
                            .eventCount(e.getValue()[0])
                            .totalCapacity(cap)
                            .totalRegistered(reg)
                            .fillRatePercent(cap > 0 ? round1(reg * 100.0 / cap) : 0.0)
                            .build();
                })
                .sorted(Comparator.comparingLong(AdminAnalyticsDto.CategoryParticipationItem::getTotalRegistered).reversed())
                .toList();

        List<AdminAnalyticsDto.PopularEventItem> popularEvents = allEvents.stream()
                .sorted(Comparator.comparingInt(UniversityEvent::getRegisteredCount).reversed()
                        .thenComparing(UniversityEvent::getEventDate))
                .limit(6)
                .map(ev -> AdminAnalyticsDto.PopularEventItem.builder()
                        .id(ev.getId())
                        .title(ev.getTitle())
                        .category(ev.getCategory())
                        .date(ev.getEventDate())
                        .location(ev.getLocation())
                        .capacity(ev.getCapacity())
                        .registered(ev.getRegisteredCount())
                        .fillRatePercent(ev.getCapacity() > 0 ? round1(ev.getRegisteredCount() * 100.0 / ev.getCapacity()) : 0.0)
                        .status(ev.getStatus())
                        .published(ev.isPublished())
                        .build())
                .toList();

        List<AdminAnalyticsDto.HallUtilizationItem> hallUtilization = allHalls.stream()
                .map(h -> {
                    long[] hc = hallCounts.getOrDefault(h.getId(), new long[2]);
                    return AdminAnalyticsDto.HallUtilizationItem.builder()
                            .hallId(h.getId())
                            .hallName(h.getName())
                            .totalApplications(hc[0])
                            .confirmedCount(hc[1])
                            .confirmedRevenue(hallRevenue.getOrDefault(h.getId(), BigDecimal.ZERO))
                            .build();
                })
                .sorted(Comparator.comparingLong(AdminAnalyticsDto.HallUtilizationItem::getTotalApplications).reversed())
                .toList();

        return AdminAnalyticsDto.builder()
                .totalEvents(allEvents.size())
                .upcomingEvents(upcomingEvents)
                .completedEvents(completedEvents)
                .cancelledEvents(cancelledEvents)
                .draftEvents(draftEvents)
                .publishedEvents(publishedEvents)
                .totalUsers(userRepository.count())
                .activeAccounts(userRepository.countByActiveTrue())
                .inactiveAccounts(userRepository.countByActiveFalse())
                .currentlyActiveUsers(userRepository.countByActiveTrueAndLastActivityAtAfter(onlineCutoff))
                .usersWhoLoggedIn(userRepository.countByLastLoginAtIsNotNull())
                .totalAdmins(userRepository.countByRole(Role.ADMIN))
                .totalRegularUsers(userRepository.countByRole(Role.USER))
                .totalApplications(totalApps)
                .pendingApplications(pendingApps)
                .approvedApplications(approvedApps)
                .rejectedApplications(rejectedApps)
                .cancelledApplications(cancelledApps)
                .expiredApplications(expiredApps)
                .confirmedApplications(confirmedApps)
                .totalEventRegistrations(eventRegistrationRepository.count())
                .totalEventCapacity(totalEventCapacity)
                .eventFillRatePercent(eventFillRate)
                .approvalRatePercent(approvalRate)
                .rejectionRatePercent(rejectionRate)
                .cancellationRatePercent(cancellationRate)
                .totalConfirmedRevenue(confirmedRevenue)
                .applicationStatusBreakdown(statusBreakdown)
                .monthlyApplicationTrends(monthlyTrends)
                .eventParticipationByCategory(categoryParticipation)
                .popularEvents(popularEvents)
                .hallUtilization(hallUtilization)
                .build();
    }

    @Transactional(readOnly = true)
    public PagedResponse<UserDto> listUsers(
            String search,
            Role role,
            Boolean active,
            Boolean loggedIn,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        String safeSort = switch (sortBy != null ? sortBy : "createdAt") {
            case "firstName", "lastName", "username", "lastLoginAt", "role", "active" -> sortBy;
            default -> "createdAt";
        };
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), Sort.by(direction, safeSort));

        Specification<User> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName")), pattern),
                        cb.like(cb.lower(root.get("lastName")), pattern),
                        cb.like(cb.lower(root.get("username")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("email"), "")), pattern),
                        cb.like(cb.lower(root.get("phoneNumber")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("department"), "")), pattern)
                ));
            }
            if (role != null) {
                predicates.add(cb.equal(root.get("role"), role));
            }
            if (active != null) {
                predicates.add(cb.equal(root.get("active"), active));
            }
            if (loggedIn != null) {
                if (loggedIn) {
                    predicates.add(cb.isNotNull(root.get("lastLoginAt")));
                } else {
                    predicates.add(cb.isNull(root.get("lastLoginAt")));
                }
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return PagedResponse.from(userRepository.findAll(spec, pageable).map(UserDto::from));
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return UserDto.from(user);
    }

    @Transactional(readOnly = true)
    public UserApplicationHistoryDto getUserApplicationHistory(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<HallApplicationDto> hallApps = hallApplicationRepository.findByApplicantIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(app -> HallApplicationDto.from(app, List.of()))
                .toList();

        List<UserApplicationHistoryDto.EventRegistrationItem> eventRegs = eventRegistrationRepository
                .findByUserIdOrderByRegisteredAtDesc(userId)
                .stream()
                .map(reg -> UserApplicationHistoryDto.EventRegistrationItem.builder()
                        .registrationId(reg.getId())
                        .event(EventDto.from(reg.getEvent(), true))
                        .registeredAt(reg.getRegisteredAt())
                        .build())
                .toList();

        return UserApplicationHistoryDto.builder()
                .user(UserDto.from(user))
                .hallApplications(hallApps)
                .eventRegistrations(eventRegs)
                .build();
    }

    @Transactional
    public UserDto updateUser(Long adminId, Long targetUserId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        String username = InputNormalizer.normalizeUsername(request.getUsername());
        String phone = InputNormalizer.normalizePhone(request.getPhoneNumber());

        if (userRepository.existsByUsernameIgnoreCaseAndIdNot(username, targetUserId)) {
            throw new DuplicateResourceException("Username '" + username + "' is already taken.");
        }
        if (userRepository.existsByPhoneNumberAndIdNot(phone, targetUserId)) {
            throw new DuplicateResourceException("Phone number '" + phone + "' is already used by another account.");
        }

        if (adminId.equals(targetUserId)) {
            if (!request.isActive()) {
                throw new ForbiddenOperationException("Administrators cannot deactivate their own account.");
            }
            if (request.getRole() != Role.ADMIN) {
                throw new ForbiddenOperationException("Administrators cannot remove their own ADMIN role.");
            }
        }

        user.setFirstName(InputNormalizer.normalizeName(request.getFirstName()));
        user.setLastName(InputNormalizer.normalizeName(request.getLastName()));
        user.setUsername(username);
        user.setPhoneNumber(phone);
        if (request.getEmail() != null) {
            user.setEmail(!request.getEmail().isBlank() ? request.getEmail().trim().toLowerCase() : null);
        }
        user.setRole(request.getRole());
        user.setActive(request.isActive());
        user.setDepartment(request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment().trim()
                : null);
        user.setBio(request.getBio() != null && !request.getBio().isBlank()
                ? request.getBio().trim()
                : null);

        User saved = userRepository.save(user);
        User actor = userRepository.findById(adminId).orElse(null);
        activityLogService.log(actor, "USER_UPDATED", "USER", saved.getId(), "@" + saved.getUsername(),
                "Updated user @" + saved.getUsername() + " (role: " + saved.getRole() + ", active: " + saved.isActive() + ")");
        return UserDto.from(saved);
    }

    @Transactional
    public UserDto updateUserStatus(Long adminId, Long targetUserId, boolean active) {
        if (adminId.equals(targetUserId) && !active) {
            throw new ForbiddenOperationException("Administrators cannot deactivate their own account.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));
        user.setActive(active);
        User saved = userRepository.save(user);
        User actor = userRepository.findById(adminId).orElse(null);
        activityLogService.log(actor, "USER_STATUS_CHANGED", "USER", saved.getId(), "@" + saved.getUsername(),
                (active ? "Activated" : "Deactivated") + " user account @" + saved.getUsername());
        return UserDto.from(saved);
    }

    @Transactional
    public void deleteUser(Long adminId, Long targetUserId) {
        if (adminId.equals(targetUserId)) {
            throw new ForbiddenOperationException("Administrators cannot delete their own account.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

        String deletedUsername = user.getUsername();

        // Update event registered counts for events this user registered to
        List<EventRegistration> regs = eventRegistrationRepository.findByUserIdOrderByRegisteredAtDesc(targetUserId);
        for (EventRegistration reg : regs) {
            UniversityEvent event = reg.getEvent();
            if (event.getRegisteredCount() > 0) {
                event.setRegisteredCount(event.getRegisteredCount() - 1);
                eventRepository.save(event);
            }
        }

        List<HallApplication> apps = hallApplicationRepository.findByApplicantIdOrderByCreatedAtDesc(targetUserId);
        if (!apps.isEmpty()) {
            List<Long> appIds = apps.stream().map(HallApplication::getId).toList();
            cancellationRequestRepository.deleteByApplicationIdIn(appIds);
            equipmentReservationRepository.deleteByApplicationIdIn(appIds);
            applicationHistoryRepository.deleteByApplicationIdIn(appIds);
            for (HallApplication app : apps) {
                fileStorageService.deleteReceipt(app.getReceiptFilename());
            }
            hallApplicationRepository.deleteAll(apps);
        }

        notificationRepository.deleteByRecipientId(targetUserId);
        eventRegistrationRepository.deleteByUserId(targetUserId);
        loginActivityRepository.deleteByUserId(targetUserId);
        fileStorageService.deleteAvatar(user.getProfilePicture());
        userRepository.delete(user);

        User actor = userRepository.findById(adminId).orElse(null);
        activityLogService.log(actor, "USER_DELETED", "USER", targetUserId, "@" + deletedUsername,
                "Permanently deleted user account @" + deletedUsername);
    }

    @Transactional(readOnly = true)
    public PagedResponse<LoginActivityDto> getLoginActivities(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        return PagedResponse.from(loginActivityRepository.findAllByOrderByLoginTimeDesc(pageable).map(LoginActivityDto::from));
    }

    @Transactional(readOnly = true)
    public List<LoginActivityDto> getUserLoginHistory(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        return loginActivityRepository.findTop10ByUserIdOrderByLoginTimeDesc(userId)
                .stream()
                .map(LoginActivityDto::from)
                .toList();
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
