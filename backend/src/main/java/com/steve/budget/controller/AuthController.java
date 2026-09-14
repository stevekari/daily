package com.steve.budget.controller;

import com.steve.budget.dto.AuthResponse;
import com.steve.budget.dto.FirebaseLoginRequest;
import com.steve.budget.dto.LoginRequest;
import com.steve.budget.dto.RegisterRequest;
import com.steve.budget.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
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
}