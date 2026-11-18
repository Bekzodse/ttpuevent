package uz.university.uems.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.*;
import uz.university.uems.entity.EventRegistration;
import uz.university.uems.entity.UniversityEvent;
import uz.university.uems.entity.User;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.EventRegistrationRepository;
import uz.university.uems.repository.UniversityEventRepository;
import uz.university.uems.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final UniversityEventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AdminActivityLogService activityLogService;

    private static final Set<String> ALLOWED_STATUSES = Set.of("Upcoming", "Completed", "Cancelled", "Draft");

    private static final List<String> GRADIENTS = List.of(
            "from-indigo-500 to-purple-600",
            "from-emerald-500 to-teal-600",
            "from-sky-500 to-blue-600",
            "from-orange-500 to-red-500",
            "from-pink-500 to-rose-500",
            "from-violet-500 to-fuchsia-500"
    );

    @Transactional(readOnly = true)
    public List<EventDto> listEvents(Long currentUserId) {
        Set<Long> registeredEventIds = currentUserId == null
                ? Set.of()
                : registrationRepository.findByUserIdOrderByRegisteredAtDesc(currentUserId)
                .stream()
                .map(r -> r.getEvent().getId())
                .collect(Collectors.toSet());

        return eventRepository.findByPublishedTrueOrderByEventDateAsc().stream()
                .map(e -> EventDto.from(e, registeredEventIds.contains(e.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDto getEvent(Long eventId, Long currentUserId) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        boolean registered = currentUserId != null
                && registrationRepository.existsByEventIdAndUserId(eventId, currentUserId);
        return EventDto.from(event, registered);
    }

    @Transactional
    public EventDto createEvent(CreateEventRequest request) {
        return createEventInternal(request, null);
    }

    @Transactional
    public EventDto createEventAdmin(CreateEventRequest request, User admin) {
        return createEventInternal(request, admin);
    }

    private EventDto createEventInternal(CreateEventRequest request, User admin) {
        int gradientIdx = Math.abs(request.getCategory().hashCode()) % GRADIENTS.size();
        boolean published = request.getPublished() != null ? request.getPublished() : true;
        String status = normalizeStatus(request.getStatus(), published ? "Upcoming" : "Draft");
        if ("Draft".equalsIgnoreCase(status) && request.getPublished() == null) {
            published = false;
        }

        UniversityEvent event = UniversityEvent.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .category(request.getCategory().trim())
                .eventDate(request.getDate())
                .eventTime(request.getTime().trim())
                .location(request.getLocation().trim())
                .organizer(request.getOrganizer().trim())
                .capacity(request.getCapacity())
                .registeredCount(0)
                .gradient(GRADIENTS.get(gradientIdx))
                .status(status)
                .imageUrl(trimOrNull(request.getImageUrl()))
                .published(published)
                .build();

        UniversityEvent saved = eventRepository.save(event);
        if (admin != null) {
            activityLogService.log(admin, "EVENT_CREATED", "EVENT", saved.getId(), saved.getTitle(),
                    "Created event '" + saved.getTitle() + "' on " + saved.getEventDate() + " at " + saved.getLocation());
        }
        return EventDto.from(saved, false);
    }

    @Transactional(readOnly = true)
    public PagedResponse<EventDto> listEventsAdmin(
            String search,
            String category,
            String status,
            Boolean published,
            String sortBy,
            String sortDir,
            int page,
            int size) {

        String safeSort = switch (sortBy != null ? sortBy : "eventDate") {
            case "title", "category", "location", "capacity", "registeredCount", "status", "createdAt", "published" -> sortBy;
            default -> "eventDate";
        };
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.min(Math.max(1, size), 100),
                Sort.by(direction, safeSort)
        );

        Specification<UniversityEvent> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("location")), pattern),
                        cb.like(cb.lower(root.get("organizer")), pattern),
                        cb.like(cb.lower(root.get("category")), pattern)
                ));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase()));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("status")), status.trim().toLowerCase()));
            }
            if (published != null) {
                predicates.add(cb.equal(root.get("published"), published));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return PagedResponse.from(
                eventRepository.findAll(spec, pageable).map(e -> EventDto.from(e, false))
        );
    }

    @Transactional(readOnly = true)
    public EventDto getEventAdmin(Long eventId) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        return EventDto.from(event, false);
    }

    @Transactional
    public EventDto updateEventAdmin(Long eventId, UpdateEventRequest request, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        if (request.getCapacity() < event.getRegisteredCount()) {
            throw new BadRequestException(
                    "Capacity (" + request.getCapacity() + ") cannot be less than currently registered participants ("
                            + event.getRegisteredCount() + ")."
            );
        }

        int gradientIdx = Math.abs(request.getCategory().hashCode()) % GRADIENTS.size();
        event.setTitle(request.getTitle().trim());
        event.setDescription(request.getDescription().trim());
        event.setCategory(request.getCategory().trim());
        event.setEventDate(request.getDate());
        event.setEventTime(request.getTime().trim());
        event.setLocation(request.getLocation().trim());
        event.setOrganizer(request.getOrganizer().trim());
        event.setCapacity(request.getCapacity());
        event.setGradient(GRADIENTS.get(gradientIdx));

        if (request.getImageUrl() != null) {
            String newImageUrl = trimOrNull(request.getImageUrl());
            if (!java.util.Objects.equals(event.getImageUrl(), newImageUrl)) {
                cleanupUploadedEventImage(event.getImageUrl());
            }
            event.setImageUrl(newImageUrl);
        }
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            event.setStatus(normalizeStatus(request.getStatus(), event.getStatus()));
        }
        if (request.getPublished() != null) {
            event.setPublished(request.getPublished());
        }

        UniversityEvent saved = eventRepository.save(event);
        activityLogService.log(admin, "EVENT_UPDATED", "EVENT", saved.getId(), saved.getTitle(),
                "Updated event '" + saved.getTitle() + "' (status: " + saved.getStatus() + ", published: " + saved.isPublished() + ")");
        return EventDto.from(saved, false);
    }

    @Transactional
    public EventDto uploadEventImage(Long eventId, MultipartFile file, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        String filename = fileStorageService.storeEventImage(file);
        String oldUrl = event.getImageUrl();
        event.setImageUrl("/api/files/events/" + filename);
        UniversityEvent saved = eventRepository.save(event);
        cleanupUploadedEventImage(oldUrl);

        activityLogService.log(admin, "EVENT_UPDATED", "EVENT", saved.getId(), saved.getTitle(),
                "Uploaded cover image for event '" + saved.getTitle() + "'");
        return EventDto.from(saved, false);
    }

    @Transactional
    public EventDto deleteEventImage(Long eventId, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        cleanupUploadedEventImage(event.getImageUrl());
        event.setImageUrl(null);
        UniversityEvent saved = eventRepository.save(event);
        activityLogService.log(admin, "EVENT_UPDATED", "EVENT", saved.getId(), saved.getTitle(),
                "Removed cover image for event '" + saved.getTitle() + "'");
        return EventDto.from(saved, false);
    }

    @Transactional
    public EventDto publishEvent(Long eventId, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        event.setPublished(true);
        if ("Draft".equalsIgnoreCase(event.getStatus())) {
            event.setStatus("Upcoming");
        }
        UniversityEvent saved = eventRepository.save(event);
        activityLogService.log(admin, "EVENT_PUBLISHED", "EVENT", saved.getId(), saved.getTitle(),
                "Published event '" + saved.getTitle() + "'");
        return EventDto.from(saved, false);
    }

    @Transactional
    public EventDto unpublishEvent(Long eventId, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        event.setPublished(false);
        if ("Upcoming".equalsIgnoreCase(event.getStatus())) {
            event.setStatus("Draft");
        }
        UniversityEvent saved = eventRepository.save(event);
        activityLogService.log(admin, "EVENT_UNPUBLISHED", "EVENT", saved.getId(), saved.getTitle(),
                "Unpublished event '" + saved.getTitle() + "'");
        return EventDto.from(saved, false);
    }

    @Transactional
    public EventDto cancelEvent(Long eventId, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        event.setStatus("Cancelled");
        UniversityEvent saved = eventRepository.save(event);
        activityLogService.log(admin, "EVENT_CANCELLED", "EVENT", saved.getId(), saved.getTitle(),
                "Cancelled event '" + saved.getTitle() + "'");
        return EventDto.from(saved, false);
    }

    @Transactional
    public EventDto updateEventStatus(Long eventId, AdminEventStatusRequest request, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        String nextStatus = normalizeStatus(request.getStatus(), event.getStatus());
        event.setStatus(nextStatus);
        if (request.getPublished() != null) {
            event.setPublished(request.getPublished());
        } else if ("Draft".equalsIgnoreCase(nextStatus)) {
            event.setPublished(false);
        } else if ("Upcoming".equalsIgnoreCase(nextStatus)) {
            event.setPublished(true);
        }
        UniversityEvent saved = eventRepository.save(event);
        activityLogService.log(admin, "EVENT_STATUS_CHANGED", "EVENT", saved.getId(), saved.getTitle(),
                "Updated status of '" + saved.getTitle() + "' to " + nextStatus + " (published: " + saved.isPublished() + ")");
        return EventDto.from(saved, false);
    }

    @Transactional
    public void deleteEvent(Long eventId, User admin) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        String title = event.getTitle();
        cleanupUploadedEventImage(event.getImageUrl());
        registrationRepository.deleteByEventId(eventId);
        eventRepository.delete(event);
        activityLogService.log(admin, "EVENT_DELETED", "EVENT", eventId, title,
                "Deleted event '" + title + "' and its registrations.");
    }

    @Transactional(readOnly = true)
    public List<EventRegistrantDto> getEventRegistrations(Long eventId) {
        if (!eventRepository.existsById(eventId)) {
            throw new ResourceNotFoundException("Event not found with id: " + eventId);
        }
        return registrationRepository.findByEventIdOrderByRegisteredAtDesc(eventId)
                .stream()
                .map(EventRegistrantDto::from)
                .toList();
    }

    @Transactional
    public EventDto registerForEvent(Long eventId, Long userId) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        if (!event.isPublished() || "Draft".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Registration is not open because this event is not published.");
        }
        if ("Cancelled".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Registration is closed because this event was cancelled.");
        }
        if ("Completed".equalsIgnoreCase(event.getStatus())) {
            throw new BadRequestException("Registration is closed because this event has already ended.");
        }
        if (registrationRepository.existsByEventIdAndUserId(eventId, userId)) {
            throw new DuplicateResourceException("You are already registered for this event.");
        }
        if (event.getRegisteredCount() >= event.getCapacity()) {
            throw new BadRequestException("No seats remaining for this event.");
        }

        registrationRepository.save(EventRegistration.builder()
                .event(event)
                .user(user)
                .build());
        event.setRegisteredCount(event.getRegisteredCount() + 1);
        return EventDto.from(eventRepository.save(event), true);
    }

    @Transactional
    public EventDto unregisterFromEvent(Long eventId, Long userId) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        EventRegistration registration = registrationRepository.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not registered for this event."));

        registrationRepository.delete(registration);
        if (event.getRegisteredCount() > 0) {
            event.setRegisteredCount(event.getRegisteredCount() - 1);
            eventRepository.save(event);
        }
        return EventDto.from(event, false);
    }

    @Transactional(readOnly = true)
    public List<EventDto> getMyEvents(Long userId) {
        return registrationRepository.findByUserIdOrderByRegisteredAtDesc(userId).stream()
                .map(r -> EventDto.from(r.getEvent(), true))
                .toList();
    }

    private String normalizeStatus(String raw, String fallback) {
        if (raw == null || raw.isBlank()) return fallback;
        for (String allowed : ALLOWED_STATUSES) {
            if (allowed.equalsIgnoreCase(raw.trim())) {
                return allowed;
            }
        }
        throw new BadRequestException("Invalid event status '" + raw + "'. Allowed: Upcoming, Completed, Cancelled, Draft.");
    }

    private void cleanupUploadedEventImage(String imageUrl) {
        if (imageUrl != null && imageUrl.startsWith("/api/files/events/")) {
            String filename = imageUrl.substring("/api/files/events/".length());
            fileStorageService.deleteEventImage(filename);
        }
    }

    private String trimOrNull(String val) {
        return val != null && !val.isBlank() ? val.trim() : null;
    }
}
