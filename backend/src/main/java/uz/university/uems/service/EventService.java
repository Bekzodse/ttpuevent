package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.CreateEventRequest;
import uz.university.uems.dto.EventDto;
import uz.university.uems.entity.EventRegistration;
import uz.university.uems.entity.UniversityEvent;
import uz.university.uems.entity.User;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.EventRegistrationRepository;
import uz.university.uems.repository.UniversityEventRepository;
import uz.university.uems.repository.UserRepository;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final UniversityEventRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final UserRepository userRepository;

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

        return eventRepository.findAllByOrderByEventDateAsc().stream()
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
        int gradientIdx = Math.abs(request.getCategory().hashCode()) % GRADIENTS.size();
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
                .status("Upcoming")
                .build();
        return EventDto.from(eventRepository.save(event), false);
    }

    @Transactional
    public EventDto registerForEvent(Long eventId, Long userId) {
        UniversityEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));

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
}
