package com.steve.budget;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.steve.budget.dto.RegisterRequest;
import com.steve.budget.dto.TransactionDTO;
import com.steve.budget.model.Transaction;
import com.steve.budget.repository.TransactionRepository;
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
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class TransactionOwnershipTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    private String aliceToken;
    private Long aliceId;

    private String bobToken;
    private Long bobId;

    @BeforeEach
    void setUp() throws Exception {
        transactionRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Alice
        RegisterRequest aliceReq = new RegisterRequest();
        aliceReq.setUsername("alice");
        aliceReq.setEmail("alice@test.com");
        aliceReq.setPassword("Password123!");
        aliceReq.setFirstName("Alice");
        aliceReq.setLastName("Owner");

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
        bobReq.setUsername("bob");
        bobReq.setEmail("bob@test.com");
        bobReq.setPassword("Password123!");
        bobReq.setFirstName("Bob");
        bobReq.setLastName("Attacker");

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
    @DisplayName("Alice can add, list, update, and delete her own transactions")
    void testAliceTransactionCRUD() throws Exception {
        // Alice adds transaction
        TransactionDTO txDto = new TransactionDTO();
        txDto.setName("Groceries");
        txDto.setAmount(BigDecimal.valueOf(45.50));
        txDto.setType(Transaction.TransactionType.EXPENSE);
        txDto.setCategory("Food & Dining");
        txDto.setDateTime(LocalDateTime.now());

        MvcResult addRes = mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries"))
                .andExpect(jsonPath("$.amount").value(45.50))
                .andReturn();

        Long txId = objectMapper.readTree(addRes.getResponse().getContentAsString()).get("id").asLong();

        // Alice lists transactions
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Groceries"));

        // Alice updates transaction
        txDto.setName("Supermarket Groceries");
        txDto.setAmount(BigDecimal.valueOf(50.00));
        mockMvc.perform(put("/api/transactions/" + txId)
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Supermarket Groceries"))
                .andExpect(jsonPath("$.amount").value(50.00));

        // Alice deletes transaction
        mockMvc.perform(delete("/api/transactions/" + txId)
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isNoContent());

        // Alice lists again -> empty
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Bob CANNOT update, delete, or read Alice's transactions (Forbidden 403)")
    void testBobCannotAccessAliceTransaction() throws Exception {
        // Alice adds transaction
        TransactionDTO txDto = new TransactionDTO();
        txDto.setName("Secret Expense");
        txDto.setAmount(BigDecimal.valueOf(100.00));
        txDto.setType(Transaction.TransactionType.EXPENSE);
        txDto.setCategory("Shopping");
        txDto.setDateTime(LocalDateTime.now());

        MvcResult addRes = mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txDto)))
                .andExpect(status().isOk())
                .andReturn();

        Long aliceTxId = objectMapper.readTree(addRes.getResponse().getContentAsString()).get("id").asLong();

        // Bob tries to update Alice's transaction -> 403 Forbidden
        TransactionDTO maliciousUpdate = new TransactionDTO();
        maliciousUpdate.setName("Hacked Name");
        maliciousUpdate.setAmount(BigDecimal.valueOf(1.00));

        mockMvc.perform(put("/api/transactions/" + aliceTxId)
                        .header("Authorization", "Bearer " + bobToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousUpdate)))
                .andExpect(status().isForbidden());

        // Bob tries to delete Alice's transaction -> 403 Forbidden
        mockMvc.perform(delete("/api/transactions/" + aliceTxId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob tries to access Alice's transactions via /api/transactions/user/{aliceId} -> 403 Forbidden
        mockMvc.perform(get("/api/transactions/user/" + aliceId)
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isForbidden());

        // Bob's own transaction list remains clean & isolated
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}

