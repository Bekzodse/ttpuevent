package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "event_halls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventHall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String building;

    @Column(nullable = false, length = 40)
    private String floor;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "hourly_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    @Column(length = 300)
    private String amenities;

    @Column(length = 500)
    private String description;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
