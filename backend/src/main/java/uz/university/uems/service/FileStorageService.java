package uz.university.uems.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.exception.FileStorageException;
import uz.university.uems.exception.ResourceNotFoundException;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB
    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );
    private static final Map<String, String> ALLOWED_RECEIPT_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/jpg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif",
            "application/pdf", ".pdf"
    );

    private final Path avatarUploadDir;
    private final Path receiptUploadDir;
    private final Path brandingUploadDir;
    private final Path eventUploadDir;

    public FileStorageService(
            @Value("${app.upload.avatar-dir}") String avatarDir,
            @Value("${app.upload.receipt-dir:./uploads/receipts}") String receiptDir,
            @Value("${app.upload.branding-dir:./uploads/branding}") String brandingDir,
            @Value("${app.upload.event-dir:./uploads/events}") String eventDir) {
        this.avatarUploadDir = Paths.get(avatarDir).toAbsolutePath().normalize();
        this.receiptUploadDir = Paths.get(receiptDir).toAbsolutePath().normalize();
        this.brandingUploadDir = Paths.get(brandingDir).toAbsolutePath().normalize();
        this.eventUploadDir = Paths.get(eventDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.avatarUploadDir);
            Files.createDirectories(this.receiptUploadDir);
            Files.createDirectories(this.brandingUploadDir);
            Files.createDirectories(this.eventUploadDir);
        } catch (IOException ex) {
            throw new FileStorageException("Could not initialize file storage directories.", ex);
        }
    }

    public String storeAvatar(MultipartFile file) {
        return storeFile(file, avatarUploadDir, ALLOWED_IMAGE_TYPES,
                "Unsupported image format. Please upload a PNG, JPG, WEBP, or GIF image.");
    }

    public String storeBrandingLogo(MultipartFile file) {
        return storeFile(file, brandingUploadDir, ALLOWED_IMAGE_TYPES,
                "Unsupported logo format. Please upload a PNG, JPG, WEBP, or GIF image.");
    }

    public String storeReceipt(MultipartFile file) {
        return storeFile(file, receiptUploadDir, ALLOWED_RECEIPT_TYPES,
                "Unsupported receipt format. Please upload a PNG, JPG, WEBP, GIF image, or PDF document.");
    }

    public String storeEventImage(MultipartFile file) {
        return storeFile(file, eventUploadDir, ALLOWED_IMAGE_TYPES,
                "Unsupported event image format. Please upload a PNG, JPG, WEBP, or GIF image.");
    }

    public Resource loadAvatar(String filename) {
        return loadFromDir(filename, avatarUploadDir, "Profile picture not found.");
    }

    public Resource loadBrandingLogo(String filename) {
        return loadFromDir(filename, brandingUploadDir, "University logo not found.");
    }

    public Resource loadReceipt(String filename) {
        return loadFromDir(filename, receiptUploadDir, "Payment receipt not found.");
    }

    public Resource loadEventImage(String filename) {
        return loadFromDir(filename, eventUploadDir, "Event image not found.");
    }

    public void deleteAvatar(String filename) {
        deleteFromDir(filename, avatarUploadDir);
    }

    public void deleteBrandingLogo(String filename) {
        deleteFromDir(filename, brandingUploadDir);
    }

    public void deleteReceipt(String filename) {
        deleteFromDir(filename, receiptUploadDir);
    }

    public void deleteEventImage(String filename) {
        deleteFromDir(filename, eventUploadDir);
    }

    private String storeFile(
            MultipartFile file, Path rootDir, Map<String, String> allowedTypes, String formatErr) {
        if (file == null || file.isEmpty()) {
            throw new FileStorageException("Please select a file to upload.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new FileStorageException("File size must be 5 MB or smaller.");
        }

        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        String extension = allowedTypes.get(contentType);
        if (extension == null) {
            throw new FileStorageException(formatErr);
        }

        validateFileMagicBytes(file, extension);

        String filename = UUID.randomUUID() + extension;
        Path targetLocation = rootDir.resolve(filename).normalize();
        if (!targetLocation.startsWith(rootDir)) {
            throw new FileStorageException("Invalid file path.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException ex) {
            throw new FileStorageException("Failed to store uploaded file. Please try again.", ex);
        }
    }

    private Resource loadFromDir(String filename, Path rootDir, String notFoundMsg) {
        if (filename == null || !filename.matches("^[a-zA-Z0-9._-]+$")) {
            throw new ResourceNotFoundException(notFoundMsg);
        }
        try {
            Path filePath = rootDir.resolve(filename).normalize();
            if (!filePath.startsWith(rootDir)) {
                throw new ResourceNotFoundException(notFoundMsg);
            }
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException(notFoundMsg);
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException(notFoundMsg);
        }
    }

    private void deleteFromDir(String filename, Path rootDir) {
        if (filename == null || filename.isBlank() || !filename.matches("^[a-zA-Z0-9._-]+$")) {
            return;
        }
        try {
            Path filePath = rootDir.resolve(filename).normalize();
            if (filePath.startsWith(rootDir)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException ignored) {
            // Non-fatal cleanup
        }
    }

    private void validateFileMagicBytes(MultipartFile file, String expectedExt) {
        byte[] header = new byte[12];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header);
            if (read < 4) {
                throw new FileStorageException("The uploaded file is empty or corrupted.");
            }
        } catch (IOException ex) {
            throw new FileStorageException("Could not read uploaded file.", ex);
        }

        boolean valid = switch (expectedExt) {
            case ".jpg" -> (header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF;
            case ".png" -> (header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47;
            case ".gif" -> header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8';
            case ".webp" -> header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            case ".pdf" -> header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F';
            default -> false;
        };

        if (!valid) {
            throw new FileStorageException("Invalid file content. Signature does not match " + expectedExt + ".");
        }
    }
}
