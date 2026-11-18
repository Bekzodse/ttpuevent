package uz.university.uems.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "university_branding")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UniversityBranding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "university_name", nullable = false, length = 160)
    private String universityName;

    @Column(name = "university_subtitle", nullable = false, length = 200)
    private String universitySubtitle;

    @Column(name = "login_headline", nullable = false, length = 200)
    private String loginHeadline;

    @Column(name = "login_description", nullable = false, length = 600)
    private String loginDescription;

    @Column(name = "primary_color", nullable = false, length = 20)
    private String primaryColor;

    @Column(name = "secondary_color", nullable = false, length = 20)
    private String secondaryColor;

    @Column(name = "logo_filename", length = 255)
    private String logoFilename;

    @Column(name = "contact_email", length = 120)
    private String contactEmail;

    @Column(name = "contact_phone", length = 40)
    private String contactPhone;

    @Column(name = "contact_address", length = 250)
    private String contactAddress;

    @Column(name = "website_url", length = 200)
    private String websiteUrl;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = Instant.now();
    }
}
