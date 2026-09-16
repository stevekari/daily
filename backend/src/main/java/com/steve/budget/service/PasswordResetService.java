package com.steve.budget.service;

import com.steve.budget.model.User;
import com.steve.budget.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

/**
 * PasswordResetService
 *
 * Manages 6-digit email verification codes, code expiration,
 * brute-force protection, and secure password updates.
 */
@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$"
    );

    private static final long CODE_EXPIRATION_SECONDS = 15 * 60; // 15 minutes
    private static final int MAX_ATTEMPTS = 5;

    private static class ResetCodeEntry {
        final String code;
        final Instant createdAt;
        int attempts;

        ResetCodeEntry(String code) {
            this.code = code;
            this.createdAt = Instant.now();
            this.attempts = 0;
        }

        boolean isExpired() {
            return Instant.now().isAfter(createdAt.plusSeconds(CODE_EXPIRATION_SECONDS));
        }
    }

    private final Map<String, ResetCodeEntry> resetCodes = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Autowired
    public PasswordResetService(UserRepository userRepository,
                                PasswordEncoder passwordEncoder,
                                EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /**
     * Generate 6-digit verification code and send to user's email.
     */
    public Map<String, Object> sendResetCode(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isEmpty() || !rawEmail.contains("@")) {
            return Map.of("success", false, "message", "Please provide a valid email address.");
        }

        String normalizedEmail = rawEmail.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            return Map.of(
                    "success", false,
                    "message", "No account found with this email address. Please register or verify your email."
            );
        }

        User user = userOpt.get();

        // Generate cryptographically secure 6-digit OTP
        int num = secureRandom.nextInt(900000) + 100000;
        String code = String.valueOf(num);

        resetCodes.put(normalizedEmail, new ResetCodeEntry(code));

        // Dispatch email notification
        emailService.sendPasswordResetCode(normalizedEmail, code, user.getFullName());

        logger.info("Generated password reset code for email: {}", normalizedEmail);

        return Map.of(
                "success", true,
                "message", "Verification code sent! Please check your email inbox.",
                "email", normalizedEmail,
                "devCode", code // Included for seamless developer testing
        );
    }

    /**
     * Verify if the supplied 6-digit code is valid.
     */
    public Map<String, Object> verifyCode(String rawEmail, String code) {
        if (rawEmail == null || rawEmail.trim().isEmpty() || code == null || code.trim().isEmpty()) {
            return Map.of("success", false, "message", "Email and 6-digit verification code are required.");
        }

        String normalizedEmail = rawEmail.trim().toLowerCase();
        ResetCodeEntry entry = resetCodes.get(normalizedEmail);

        if (entry == null) {
            return Map.of("success", false, "message", "No reset request found or code has expired. Please request a new code.");
        }

        if (entry.isExpired()) {
            resetCodes.remove(normalizedEmail);
            return Map.of("success", false, "message", "Verification code has expired. Please request a new code.");
        }

        entry.attempts++;
        if (entry.attempts > MAX_ATTEMPTS) {
            resetCodes.remove(normalizedEmail);
            return Map.of("success", false, "message", "Too many invalid attempts. Please request a new code.");
        }

        if (!entry.code.trim().equals(code.trim())) {
            int remaining = MAX_ATTEMPTS - entry.attempts;
            return Map.of(
                    "success", false,
                    "message", "Invalid verification code. (" + remaining + " attempts remaining)"
            );
        }

        return Map.of("success", true, "message", "Code verified successfully.");
    }

    /**
     * Verify code and update user's password.
     */
    public Map<String, Object> resetPassword(String rawEmail, String code, String newPassword, String confirmPassword) {
        Map<String, Object> verifyRes = verifyCode(rawEmail, code);
        if (!Boolean.TRUE.equals(verifyRes.get("success"))) {
            return verifyRes;
        }

        if (newPassword == null || confirmPassword == null) {
            return Map.of("success", false, "message", "Password and confirmation are required.");
        }

        if (!newPassword.equals(confirmPassword)) {
            return Map.of("success", false, "message", "Passwords do not match.");
        }

        if (newPassword.length() < 8) {
            return Map.of("success", false, "message", "Password must be at least 8 characters long.");
        }

        if (!PASSWORD_PATTERN.matcher(newPassword).matches()) {
            return Map.of(
                    "success", false,
                    "message", "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@$!%*?&# etc.)"
            );
        }

        String normalizedEmail = rawEmail.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            return Map.of("success", false, "message", "User account not found.");
        }

        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Remove the reset code upon success
        resetCodes.remove(normalizedEmail);

        logger.info("Password successfully reset for user: {}", user.getUsername());

        return Map.of(
                "success", true,
                "message", "Password reset successfully! You can now log in with your new password.",
                "username", user.getUsername()
        );
    }
}

