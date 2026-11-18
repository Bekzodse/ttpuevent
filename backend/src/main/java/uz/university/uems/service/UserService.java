package uz.university.uems.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.university.uems.dto.ChangePasswordRequest;
import uz.university.uems.dto.UpdateProfileRequest;
import uz.university.uems.dto.UserDto;
import uz.university.uems.entity.User;
import uz.university.uems.exception.BadRequestException;
import uz.university.uems.exception.DuplicateResourceException;
import uz.university.uems.exception.ResourceNotFoundException;
import uz.university.uems.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(Long userId) {
        User user = findUser(userId);
        return UserDto.from(user);
    }

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        String phone = InputNormalizer.normalizePhone(request.getPhoneNumber());

        if (userRepository.existsByPhoneNumberAndIdNot(phone, userId)) {
            throw new DuplicateResourceException("Phone number '" + phone + "' is already used by another account.");
        }

        user.setFirstName(InputNormalizer.normalizeName(request.getFirstName()));
        user.setLastName(InputNormalizer.normalizeName(request.getLastName()));
        user.setPhoneNumber(phone);
        user.setDepartment(request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment().trim()
                : null);
        user.setBio(request.getBio() != null && !request.getBio().isBlank()
                ? request.getBio().trim()
                : null);

        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserDto uploadAvatar(Long userId, MultipartFile file) {
        User user = findUser(userId);
        String newFilename = fileStorageService.storeAvatar(file);
        String oldFilename = user.getProfilePicture();

        user.setProfilePicture(newFilename);
        User saved = userRepository.save(user);

        if (oldFilename != null && !oldFilename.equals(newFilename)) {
            fileStorageService.deleteAvatar(oldFilename);
        }
        return UserDto.from(saved);
    }

    @Transactional
    public UserDto deleteAvatar(Long userId) {
        User user = findUser(userId);
        String oldFilename = user.getProfilePicture();
        if (oldFilename != null && !oldFilename.isBlank()) {
            user.setProfilePicture(null);
            userRepository.save(user);
            fileStorageService.deleteAvatar(oldFilename);
        }
        return UserDto.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found."));
    }
}
