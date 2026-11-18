package uz.university.uems.service;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.university.uems.dto.AdminActivityLogDto;
import uz.university.uems.dto.PagedResponse;
import uz.university.uems.entity.AdminActivityLog;
import uz.university.uems.entity.User;
import uz.university.uems.repository.AdminActivityLogRepository;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminActivityLogService {

    private final AdminActivityLogRepository activityLogRepository;

    @Transactional
    public void log(
            User actor,
            String actionType,
            String targetType,
            Long targetId,
            String targetLabel,
            String details) {
        String username = actor != null ? actor.getUsername() : "system";
        String fullName = actor != null
                ? (actor.getFirstName() + " " + actor.getLastName()).trim()
                : "System";
        activityLogRepository.save(AdminActivityLog.builder()
                .actorId(actor != null ? actor.getId() : null)
                .actorUsername(username)
                .actorFullName(fullName)
                .actionType(actionType)
                .targetType(targetType)
                .targetId(targetId)
                .targetLabel(targetLabel)
                .details(details)
                .build());
    }

    @Transactional(readOnly = true)
    public PagedResponse<AdminActivityLogDto> listLogs(
            String search,
            String actionType,
            String targetType,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(
                Math.max(0, page),
                Math.min(Math.max(1, size), 100),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        Specification<AdminActivityLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("actorUsername")), pattern),
                        cb.like(cb.lower(root.get("actorFullName")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("targetLabel"), "")), pattern),
                        cb.like(cb.lower(cb.coalesce(root.get("details"), "")), pattern),
                        cb.like(cb.lower(root.get("actionType")), pattern)
                ));
            }
            if (actionType != null && !actionType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("actionType")), actionType.trim().toUpperCase()));
            }
            if (targetType != null && !targetType.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("targetType")), targetType.trim().toUpperCase()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return PagedResponse.from(activityLogRepository.findAll(spec, pageable).map(AdminActivityLogDto::from));
    }

    @Transactional(readOnly = true)
    public List<AdminActivityLogDto> getRecentLogs() {
        return activityLogRepository.findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(AdminActivityLogDto::from)
                .toList();
    }
}
