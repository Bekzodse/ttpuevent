package uz.university.uems.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.university.uems.entity.UniversityBranding;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "University portal branding, colors, logo, and contact configuration")
public class UniversityBrandingDto {
    private Long id;
    private String universityName;
    private String universitySubtitle;
    private String loginHeadline;
    private String loginDescription;
    private String primaryColor;
    private String secondaryColor;
    private String logoUrl;
    private String contactEmail;
    private String contactPhone;
    private String contactAddress;
    private String websiteUrl;
    private Instant updatedAt;

    public static UniversityBrandingDto from(UniversityBranding b) {
        String logoUrl = b.getLogoFilename() != null && !b.getLogoFilename().isBlank()
                ? "/api/files/branding/" + b.getLogoFilename()
                : null;
        return UniversityBrandingDto.builder()
                .id(b.getId())
                .universityName(b.getUniversityName())
                .universitySubtitle(b.getUniversitySubtitle())
                .loginHeadline(b.getLoginHeadline())
                .loginDescription(b.getLoginDescription())
                .primaryColor(b.getPrimaryColor())
                .secondaryColor(b.getSecondaryColor())
                .logoUrl(logoUrl)
                .contactEmail(b.getContactEmail())
                .contactPhone(b.getContactPhone())
                .contactAddress(b.getContactAddress())
                .websiteUrl(b.getWebsiteUrl())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
