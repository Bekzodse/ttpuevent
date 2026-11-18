package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.UniversityBrandingDto;
import uz.university.uems.dto.UpdateBrandingRequest;
import uz.university.uems.entity.UniversityBranding;
import uz.university.uems.repository.UniversityBrandingRepository;

@Service
@RequiredArgsConstructor
public class BrandingService {

    private final UniversityBrandingRepository brandingRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public UniversityBrandingDto getBranding() {
        return UniversityBrandingDto.from(getOrCreateEntity());
    }

    @Transactional
    public UniversityBrandingDto updateBranding(UpdateBrandingRequest req) {
        UniversityBranding b = getOrCreateEntity();
        b.setUniversityName(req.getUniversityName().trim());
        b.setUniversitySubtitle(req.getUniversitySubtitle().trim());
        b.setLoginHeadline(req.getLoginHeadline().trim());
        b.setLoginDescription(req.getLoginDescription().trim());
        b.setPrimaryColor(req.getPrimaryColor().trim());
        b.setSecondaryColor(req.getSecondaryColor().trim());
        b.setContactEmail(trimOrNull(req.getContactEmail()));
        b.setContactPhone(trimOrNull(req.getContactPhone()));
        b.setContactAddress(trimOrNull(req.getContactAddress()));
        b.setWebsiteUrl(trimOrNull(req.getWebsiteUrl()));
        return UniversityBrandingDto.from(brandingRepository.save(b));
    }

    @Transactional
    public UniversityBrandingDto uploadLogo(MultipartFile file) {
        UniversityBranding b = getOrCreateEntity();
        String newFile = fileStorageService.storeBrandingLogo(file);
        String oldFile = b.getLogoFilename();
        b.setLogoFilename(newFile);
        UniversityBranding saved = brandingRepository.save(b);
        if (oldFile != null && !oldFile.equals(newFile)) {
            fileStorageService.deleteBrandingLogo(oldFile);
        }
        return UniversityBrandingDto.from(saved);
    }

    @Transactional
    public UniversityBrandingDto deleteLogo() {
        UniversityBranding b = getOrCreateEntity();
        String oldFile = b.getLogoFilename();
        if (oldFile != null && !oldFile.isBlank()) {
            b.setLogoFilename(null);
            brandingRepository.save(b);
            fileStorageService.deleteBrandingLogo(oldFile);
        }
        return UniversityBrandingDto.from(b);
    }

    private UniversityBranding getOrCreateEntity() {
        return brandingRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> brandingRepository.save(UniversityBranding.builder()
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
                        .build()));
    }

    private String trimOrNull(String val) {
        return val != null && !val.isBlank() ? val.trim() : null;
    }
}
