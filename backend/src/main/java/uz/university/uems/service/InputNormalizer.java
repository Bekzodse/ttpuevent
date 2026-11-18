package uz.university.uems.service;

import uz.university.uems.exception.BadRequestException;

public final class InputNormalizer {

    private InputNormalizer() {}

    public static String normalizePhone(String raw) {
        if (raw == null) {
            throw new BadRequestException("Phone number is required.");
        }
        String trimmed = raw.trim();
        boolean hasPlus = trimmed.startsWith("+");
        String digits = trimmed.replaceAll("[^0-9]", "");
        if (digits.length() < 7 || digits.length() > 15) {
            throw new BadRequestException("Phone number must contain between 7 and 15 digits.");
        }
        return hasPlus ? "+" + digits : digits;
    }

    public static String normalizeUsername(String raw) {
        if (raw == null) {
            throw new BadRequestException("Username is required.");
        }
        return raw.trim().toLowerCase();
    }

    public static String normalizeName(String raw) {
        return raw == null ? null : raw.trim().replaceAll("\\s+", " ");
    }
}
