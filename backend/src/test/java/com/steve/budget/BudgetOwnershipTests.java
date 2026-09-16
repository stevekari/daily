package com.steve.budget;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.steve.budget.dto.RegisterRequest;
import com.steve.budget.model.Budget;
import com.steve.budget.repository.BudgetRepository;
import com.steve.budget.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class BudgetOwnershipTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BudgetRepository budgetRepository;

    private String aliceToken;
    private Long aliceId;

    private String bobToken;
    private Long bobId;

    @BeforeEach
    void setUp() throws Exception {
        budgetRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Alice
        RegisterRequest aliceReq = new RegisterRequest();
        aliceReq.setUsername("alice_budget");
        aliceReq.setEmail("alice_b@test.com");
        aliceReq.setPassword("Password123!");
        aliceReq.setFirstName("Alice");
        aliceReq.setLastName("Budget");

        MvcResult aliceRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(aliceReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode aliceJson = objectMapper.readTree(aliceRes.getResponse().getContentAsString());
        aliceToken = aliceJson.get("token").asText();
        aliceId = aliceJson.get("userId").asLong();

        // 2. Register Bob
        RegisterRequest bobReq = new RegisterRequest();
        bobReq.setUsername("bob_budget");
        bobReq.setEmail("bob_b@test.com");
        bobReq.setPassword("Password123!");
        bobReq.setFirstName("Bob");
        bobReq.setLastName("Budget");

        MvcResult bobRes = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bobReq)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode bobJson = objectMapper.readTree(bobRes.getResponse().getContentAsString());
        bobToken = bobJson.get("token").asText();
        bobId = bobJson.get("userId").asLong();
    }

    @Test
    @DisplayName("Alice creates and updates budget, and accesses summary")
    void testAliceBudgetLifecycle() throws Exception {
        Budget b = new Budget();
        b.setName("Alice Monthly Budget");
        b.setTotalBudget(BigDecimal.valueOf(2000.00));
        b.setDailyLimit(BigDecimal.valueOf(65.00));
        b.setMonthlyLimit(BigDecimal.valueOf(2000.00));

        MvcResult createRes = mockMvc.perform(post("/api/budget/create-or-update")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(b)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        Long budgetId = objectMapper.readTree(createRes.getResponse().getContentAsString())
                .get("budget").get("id").asLong();

        // Alice fetches summary
        mockMvc.perform(get("/api/budget/" + budgetId + "/summary")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBudget").value(2000.00))
                .andExpect(jsonPath("$.remaining").value(2000.00));
    }

    @Test
    @DisplayName("Bob CANNOT view summary, update, or delete Alice's budget (Forbidden 403)")
    void testBobCannotAccessAliceBudget() throws Exception {
        // Alice creates budget
        Budget b = new Budget();
        b.setName("Alice Private Budget");
        b.setTotalBudget(BigDecimal.valueOf(5000.00));
        b.setDailyLimit(BigDecimal.valueOf(150.00));

        MvcResult createRes = mockMvc.perform(post("/api/budget/create-or-update")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(b)))
                .andExpect(status().isOk())
                .andReturn();

        Long aliceBudgetId = objectMapper.readTree(createRes.getResponse().getContentAsString())
                .get("budget").get("id").asLong();

        // Bob tries to view Alice's budget summary -> 403 Forbidden
        mockMvc.perform(get("/api/budget/" + aliceBudgetId + "/summary")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to update Alice's budget -> 403 Forbidden
        Budget maliciousUpdate = new Budget();
        maliciousUpdate.setName("Hacked Budget");
        maliciousUpdate.setTotalBudget(BigDecimal.valueOf(10.00));

        mockMvc.perform(put("/api/budget/" + aliceBudgetId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousUpdate)))
                .andExpect(status().isForbidden());

        // Bob tries to delete Alice's budget -> 403 Forbidden
        mockMvc.perform(delete("/api/budget/" + aliceBudgetId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to query /api/budget/user/{aliceId} -> 403 Forbidden
        mockMvc.perform(get("/api/budget/user/" + aliceId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());
    }
}

