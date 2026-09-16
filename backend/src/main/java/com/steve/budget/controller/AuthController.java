package com.steve.budget.controller;

import com.steve.budget.dto.*;
import com.steve.budget.service.AuthService;
import com.steve.budget.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @Autowired
    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        AuthResponse response = authService.register(req);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/firebase")
    public ResponseEntity<AuthResponse> loginWithFirebase(@RequestBody FirebaseLoginRequest req) {
        AuthResponse response = authService.authenticateWithFirebase(req);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/forgot-password
     * Request 6-digit verification code to be sent to user's email.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        Map<String, Object> result = passwordResetService.sendResetCode(req != null ? req.getEmail() : null);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    /**
     * POST /api/auth/verify-reset-code
     * Verify that the 6-digit code entered by the user is valid.
     */
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, Object>> verifyResetCode(@RequestBody VerifyResetCodeRequest req) {
        String email = req != null ? req.getEmail() : null;
        String code = req != null ? req.getCode() : null;
        Map<String, Object> result = passwordResetService.verifyCode(email, code);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    /**
     * POST /api/auth/reset-password
     * Confirm password reset with verified 6-digit code and new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest req) {
        String email = req != null ? req.getEmail() : null;
        String code = req != null ? req.getCode() : null;
        String newPassword = req != null ? req.getNewPassword() : null;
        String confirmPassword = req != null ? req.getConfirmPassword() : null;

        Map<String, Object> result = passwordResetService.resetPassword(email, code, newPassword, confirmPassword);
        if (Boolean.TRUE.equals(result.get("success"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}