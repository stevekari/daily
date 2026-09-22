package com.steve.budget.controller;

import com.steve.budget.dto.TransactionDTO;
import com.steve.budget.security.UserPrincipal;
import com.steve.budget.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * POST /api/transactions
     * Add a new transaction for the authenticated user
     */
    @PostMapping
    public ResponseEntity<TransactionDTO> addTransaction(
            @RequestBody TransactionDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            dto.setUserId(principal.getId());
        }
        
        TransactionDTO created = transactionService.addTransaction(dto);
        return ResponseEntity.ok(created);
    }

    /**
     * POST /api/transactions/batch
     * Add multiple transactions in batch for the authenticated user
     */
    @PostMapping("/batch")
    public ResponseEntity<List<TransactionDTO>> importBatch(
            @RequestBody List<TransactionDTO> dtos,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal != null ? principal.getId() : null;
        if (userId == null && dtos != null && !dtos.isEmpty()) {
            userId = dtos.get(0).getUserId();
        }
        List<TransactionDTO> created = transactionService.addTransactionsBatch(dtos, userId);
        return ResponseEntity.ok(created);
    }

    /**
     * GET /api/transactions
     * Get transactions for the authenticated user
     */
    @GetMapping
    public ResponseEntity<List<TransactionDTO>> getAllTransactions(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            return ResponseEntity.ok(transactionService.getUserTransactions(principal.getId()));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * GET /api/transactions/daily
     * Get today's transactions for the authenticated user
     */
    @GetMapping("/daily")
    public ResponseEntity<List<TransactionDTO>> getDailyTransactions(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            return ResponseEntity.ok(transactionService.getDailyTransactions(principal.getId()));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * GET /api/transactions/weekly
     * Get weekly transactions for the authenticated user
     */
    @GetMapping("/weekly")
    public ResponseEntity<List<TransactionDTO>> getWeeklyTransactions(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            return ResponseEntity.ok(transactionService.getWeeklyTransactions(principal.getId()));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * GET /api/transactions/monthly
     * Get monthly transactions for the authenticated user
     */
    @GetMapping("/monthly")
    public ResponseEntity<List<TransactionDTO>> getMonthlyTransactions(
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            return ResponseEntity.ok(transactionService.getMonthlyTransactions(principal.getId()));
        }
        return ResponseEntity.ok(List.of());
    }

    /**
     * PUT /api/transactions/{id}
     * Update an existing transaction (enforces ownership)
     */
    @PutMapping("/{id}")
    public ResponseEntity<TransactionDTO> updateTransaction(
            @PathVariable Long id,
            @RequestBody TransactionDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Long currentUserId = principal != null ? principal.getId() : null;
        TransactionDTO updated = transactionService.updateTransaction(id, dto, currentUserId);
        return ResponseEntity.ok(updated);
    }

    /**
     * PATCH /api/transactions/{id}
     * Partially update an existing transaction (enforces ownership)
     */
    @PatchMapping("/{id}")
    public ResponseEntity<TransactionDTO> patchTransaction(
            @PathVariable Long id,
            @RequestBody TransactionDTO dto,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Long currentUserId = principal != null ? principal.getId() : null;
        TransactionDTO updated = transactionService.updateTransaction(id, dto, currentUserId);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/transactions/{id}
     * Delete a transaction (enforces ownership)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Long currentUserId = principal != null ? principal.getId() : null;
        transactionService.deleteTransaction(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/transactions/user/{userId}
     * Get transactions for a specific user (verifies ownership)
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserTransactions(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null && !principal.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied: cannot access another user's transactions"));
        }

        return ResponseEntity.ok(transactionService.getUserTransactions(userId));
    }

    /**
     * GET /api/transactions/user/{userId}/daily
     */
    @GetMapping("/user/{userId}/daily")
    public ResponseEntity<?> getUserDailyTransactions(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null && !principal.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied: cannot access another user's transactions"));
        }

        return ResponseEntity.ok(transactionService.getDailyTransactions(userId));
    }

    /**
     * GET /api/transactions/user/{userId}/weekly
     */
    @GetMapping("/user/{userId}/weekly")
    public ResponseEntity<?> getUserWeeklyTransactions(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null && !principal.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied: cannot access another user's transactions"));
        }

        return ResponseEntity.ok(transactionService.getWeeklyTransactions(userId));
    }

    /**
     * GET /api/transactions/user/{userId}/monthly
     */
    @GetMapping("/user/{userId}/monthly")
    public ResponseEntity<?> getUserMonthlyTransactions(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null && !principal.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied: cannot access another user's transactions"));
        }

        return ResponseEntity.ok(transactionService.getMonthlyTransactions(userId));
    }
}