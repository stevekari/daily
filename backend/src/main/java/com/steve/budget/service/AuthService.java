package com.steve.budget.service;

import com.steve.budget.dto.AuthResponse;
import com.steve.budget.dto.FirebaseLoginRequest;
import com.steve.budget.dto.LoginRequest;
import com.steve.budget.dto.RegisterRequest;
import com.steve.budget.model.User;
import com.steve.budget.repository.UserRepository;
import com.steve.budget.security.FirebaseTokenVerifier;
import com.steve.budget.security.JwtUtils;
import com.steve.budget.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]).{8,}$"
    );

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final LoginAttemptService loginAttemptService;
    private final FirebaseTokenVerifier firebaseTokenVerifier;

    @Autowired
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtils jwtUtils,
                       LoginAttemptService loginAttemptService,
                       FirebaseTokenVerifier firebaseTokenVerifier) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.loginAttemptService = loginAttemptService;
        this.firebaseTokenVerifier = firebaseTokenVerifier;
    }

    public AuthResponse authenticateWithFirebase(FirebaseLoginRequest req) {
        if (req == null || req.getIdToken() == null || req.getIdToken().trim().isEmpty()) {
            return new AuthResponse(false, "Firebase ID token is required");
        }

        FirebaseTokenVerifier.FirebaseUserInfo userInfo = firebaseTokenVerifier.verifyToken(req.getIdToken().trim());
        if (userInfo == null || userInfo.getUid() == null) {
            return new AuthResponse(false, "Invalid or unverified Firebase ID token");
        }

        String email = userInfo.getEmail() != null ? userInfo.getEmail().trim().toLowerCase() : null;
        String uid = userInfo.getUid();

        // 1. Try finding existing user by email
        Optional<User> userOpt = Optional.empty();
        if (email != null && !email.isEmpty()) {
            userOpt = userRepository.findByEmail(email);
        }

        // 2. If not found by email, try finding by firebase username
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername("fb_" + uid);
        }

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            UserPrincipal principal = UserPrincipal.build(user);
            String token = jwtUtils.generateToken(principal);

            return new AuthResponse(
                    true,
                    "Firebase authentication successful",
                    token,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName()
            );
        } else {
            // Account is NOT registered in database yet
            String firstName = "";
            String lastName = "";
            if (userInfo.getName() != null && !userInfo.getName().isBlank()) {
                String[] parts = userInfo.getName().trim().split("\\s+", 2);
                firstName = parts[0];
                if (parts.length > 1) {
                    lastName = parts[1];
                }
            }

            String candidateUsername = "";
            if (email != null && email.contains("@")) {
                candidateUsername = email.substring(0, email.indexOf("@")).replaceAll("[^a-zA-Z0-9_.]", "");
            } else if (!firstName.isEmpty()) {
                candidateUsername = firstName.toLowerCase().replaceAll("[^a-z0-9_.]", "");
            }

            return new AuthResponse(
                    false,
                    "USER_NOT_REGISTERED",
                    null,
                    null,
                    candidateUsername,
                    email,
                    firstName,
                    lastName
            );
        }
    }

    public AuthResponse register(RegisterRequest req) {
        if (req.getUsername() == null || req.getUsername().trim().isEmpty()) {
            return new AuthResponse(false, "Username is required");
        }

        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            return new AuthResponse(false, "Email is required");
        }

        if (req.getPassword() == null || req.getConfirmPassword() == null) {
            return new AuthResponse(false, "Password and confirmation are required");
        }

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            return new AuthResponse(false, "Passwords do not match");
        }

        String rawPassword = req.getPassword();
        if (rawPassword.length() < 8) {
            return new AuthResponse(false, "Password must be at least 8 characters long");
        }

        if (!PASSWORD_PATTERN.matcher(rawPassword).matches()) {
            return new AuthResponse(false, "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol (@$!%*?&# etc.)");
        }

        String normalizedUsername = req.getUsername().trim();
        String normalizedEmail = req.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(normalizedUsername)) {
            return new AuthResponse(false, "Username already taken");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            return new AuthResponse(false, "Email already registered");
        }

        // Salted BCrypt password hashing
        String encodedPassword = passwordEncoder.encode(rawPassword);

        User newUser = new User(
                normalizedUsername,
                normalizedEmail,
                encodedPassword,
                req.getFirstName() != null ? req.getFirstName().trim() : null,
                req.getLastName() != null ? req.getLastName().trim() : null
        );

        User saved = userRepository.save(newUser);
        UserPrincipal principal = UserPrincipal.build(saved);
        String token = jwtUtils.generateToken(principal);

        return new AuthResponse(
                true,
                "Registration successful",
                token,
                saved.getId(),
                saved.getUsername(),
                saved.getEmail(),
                saved.getFirstName(),
                saved.getLastName()
        );
    }

    public AuthResponse login(LoginRequest req) {
        if (req.getUsername() == null || req.getUsername().trim().isEmpty()) {
            return new AuthResponse(false, "Username is required");
        }
        if (req.getPassword() == null || req.getPassword().isEmpty()) {
            return new AuthResponse(false, "Password is required");
        }

        String username = req.getUsername().trim();

        // 1. Check brute force lockout
        if (loginAttemptService.isBlocked(username)) {
            long remainingMinutes = loginAttemptService.getRemainingLockoutMinutes(username);
            return new AuthResponse(false, "Account temporarily locked due to repeated failed login attempts. Please try again in " + remainingMinutes + " minute(s).");
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty() && username.contains("@")) {
            userOpt = userRepository.findByEmail(username.toLowerCase());
        }

        if (userOpt.isEmpty()) {
            loginAttemptService.loginFailed(username);
            AuthResponse notFoundResp = new AuthResponse(false, "USER_NOT_FOUND");
            if (username.contains("@")) {
                notFoundResp.setEmail(username.toLowerCase());
                notFoundResp.setUsername(username.substring(0, username.indexOf("@")));
            } else {
                notFoundResp.setUsername(username);
            }
            return notFoundResp;
        }

        User user = userOpt.get();
        boolean passwordMatches = false;

        // Check if password matches BCrypt hash
        if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$") || user.getPassword().startsWith("$2y$")) {
            passwordMatches = passwordEncoder.matches(req.getPassword(), user.getPassword());
        } else {
            // Legacy plain text check & auto-upgrade to BCrypt hash
            if (user.getPassword().equals(req.getPassword())) {
                passwordMatches = true;
                user.setPassword(passwordEncoder.encode(req.getPassword()));
                userRepository.save(user);
            }
        }

        if (!passwordMatches) {
            loginAttemptService.loginFailed(username);
            return new AuthResponse(false, getInvalidCredentialsMessage(username));
        }

        // Login successful: clear failure counts
        loginAttemptService.loginSucceeded(username);

        UserPrincipal principal = UserPrincipal.build(user);
        String token = jwtUtils.generateToken(principal);

        return new AuthResponse(
                true,
                "Login successful",
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName()
        );
    }

    private String getInvalidCredentialsMessage(String username) {
        int remaining = loginAttemptService.getRemainingAttempts(username);
        if (remaining <= 0) {
            return "Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.";
        }
        return "Invalid username or password. (" + remaining + " attempts remaining before lockout)";
    }
}