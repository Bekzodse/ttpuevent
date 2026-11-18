package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpirationScheduler {

    private final HallApplicationService applicationService;

    @Scheduled(fixedDelay = 60_000)
    public void checkExpiredReservations() {
        try {
            int expired = applicationService.expireOverdueReservations();
            if (expired > 0) {
                log.info("Automatically expired {} unpaid hall reservation(s).", expired);
            }
        } catch (Exception ex) {
            log.warn("Error while checking expired hall reservations: {}", ex.getMessage());
        }
    }
}
