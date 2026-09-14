package com.steve.budget.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/api")
    public ResponseEntity<Map<String, Object>> apiRoot() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("service", "Steve Budget API");
        response.put("status", "UP");
        response.put("version", "1.0.0");
        
        Map<String, String> endpoints = new LinkedHashMap<>();
        endpoints.put("auth", "/api/auth/login, /api/auth/register");
        endpoints.put("budget", "/api/budget/user/{userId}");
        endpoints.put("transactions", "/api/transactions/user/{userId}");
        endpoints.put("h2Console", "/h2-console");
        response.put("availableEndpoints", endpoints);

        return ResponseEntity.ok(response);
    }



    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> health = new LinkedHashMap<>();
        health.put("status", "UP");
        return ResponseEntity.ok(health);
    }
}
