package uz.university.uems.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.AdminStatsDto;
import uz.university.uems.dto.AdminUpdateUserRequest;
import uz.university.uems.dto.LoginActivityDto;
import uz.university.uems.dto.PagedResponse;
import uz.university.uems.dto.UserDto;
import uz.university.uems.entity.EventRegistration;
import uz.university.uems.entity.HallApplication;
import uz.university.uems.entity.Role;
import uz.university.uems.entity.UniversityEvent;
import uz.university.uems.entity.User;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ForbiddenOperationException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.ApplicationHistoryRepository;
import uz.university.uems.repository.CancellationRequestRepository;
import uz.university.uems.repository.EquipmentReservationRepository;
import uz.university.uems.repository.EventRegistrationRepository;
import uz.university.uems.repository.HallApplicationRepository;
import uz.university.uems.repository.LoginActivityRepository;
import uz.university.uems.repository.NotificationRepository;
import uz.university.uems.repository.UniversityEventRepository;
import uz.university.uems.repository.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final LoginActivityRepository loginActivityRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final UniversityEventRepository eventRepository;
    private final HallApplicationRepository hallApplicationRepository;
    private final ApplicationHistoryRepository applicationHistoryRepository;
    private final EquipmentReservationRepository equipmentReservationRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final NotificationRepository notificationRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public AdminStatsDto getStats() {
        Instant onlineCutoff = Instant.now().minus(15, ChronoUnit.MINUTES);
        return AdminStatsDto.builder()
                .totalUsers(userRepository.count())
                .activeAccounts(userRepository.countByActiveTrue())
                .inactiveAccounts(userRepository.countByActiveFalse())
                .currentlyActiveUsers(userRepository.countByActiveTrueAndLastActivityAtAfter(onlineCutoff))
                .usersWhoLoggedIn(userRepository.countByLastLoginAtIsNotNull())
                .totalAdmins(userRepository.countByRole(Role.ADMIN))
                .totalRegularUsers(userRepository.countByRole(Role.USER))
                .totalEvents(eventRepository.count())
                .totalEventRegistrations(eventRegistrationRepository.count())
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
        user.setRole(request.getRole());
        user.setActive(request.isActive());
        user.setDepartment(request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment().trim()
                : null);
        user.setBio(request.getBio() != null && !request.getBio().isBlank()
                ? request.getBio().trim()
                : null);

        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUserStatus(Long adminId, Long targetUserId, boolean active) {
        if (adminId.equals(targetUserId) && !active) {
            throw new ForbiddenOperationException("Administrators cannot deactivate their own account.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));
        user.setActive(active);
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long adminId, Long targetUserId) {
        if (adminId.equals(targetUserId)) {
            throw new ForbiddenOperationException("Administrators cannot delete their own account.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + targetUserId));

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
}
