package com.steve.budget;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.steve.budget.dto.LoginRequest;
import com.steve.budget.dto.RegisterRequest;
import com.steve.budget.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a new user with strong password")
    void testRegisterSuccess() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("authtestuser");
        req.setEmail("authtest@example.com");
        req.setPassword("SecureP@ss123!");
        req.setFirstName("Auth");
        req.setLastName("User");
        req.setMonthlyBudget(1500.0);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username").value("authtestuser"))
                .andExpect(jsonPath("$.email").value("authtest@example.com"));
    }

    @Test
    @DisplayName("Should reject registration with weak password")
    void testRegisterWeakPassword() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setUsername("weakuser");
        req.setEmail("weak@example.com");
        req.setPassword("123"); // Too weak

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should successfully login and return JWT token")
    void testLoginSuccess() throws Exception {
        // First register
        RegisterRequest regReq = new RegisterRequest();
        regReq.setUsername("loginuser");
        regReq.setEmail("login@example.com");
        regReq.setPassword("Password123!");
        regReq.setFirstName("Login");
        regReq.setLastName("User");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isOk());

        // Now login
        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsername("loginuser");
        loginReq.setPassword("Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.username").value("loginuser"));
    }

    @Test
    @DisplayName("Should reject login with invalid credentials")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest loginReq = new LoginRequest();
        loginReq.setUsername("nonexistent");
        loginReq.setPassword("WrongPassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should block unauthenticated requests to protected endpoints")
    void testUnauthenticatedAccessBlocked() throws Exception {
        mockMvc.perform(get("/api/transactions"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/budget/user/1"))
                .andExpect(status().isUnauthorized());
    }
}

