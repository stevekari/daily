package com.steve.budget.controller;

import com.steve.budget.dto.BudgetSummaryDTO;
import com.steve.budget.model.Budget;
import com.steve.budget.model.User;
import com.steve.budget.security.UserPrincipal;
import com.steve.budget.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    private final BudgetService budgetService;

    @Autowired
    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    /**
     * POST /api/budget
     * Create a new budget for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<Budget> createBudget(
            @RequestBody Budget budget,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            budget.setUser(new User(principal.getId()));
        }
        
        Budget created = budgetService.createBudget(budget);
        return ResponseEntity.ok(created);
    }

    /**
     * POST /api/budget/create-or-update
     * Create a new budget or update existing one for authenticated user.
     */
    @PostMapping("/create-or-update")
    public ResponseEntity<Map<String, Object>> createOrUpdateBudget(
            @RequestBody Budget budget,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null) {
            budget.setUser(new User(principal.getId()));
        }

        try {
            Budget result = budgetService.createOrUpdateBudget(budget);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Budget created/updated successfully");
            response.put("budget", result);

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * GET /api/budget/user/{userId}
     * Get all budgets for a specific user (must match authenticated user).
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBudgets(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        if (principal != null && !principal.getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied: cannot access another user's budget"));
        }

        List<Budget> budgets = budgetService.getUserBudgets(userId);
        return ResponseEntity.ok(budgets);
    }

    /**
     * GET /api/budget/{budgetId}/summary
     * Get budget summary with spending totals and remaining amount.
     */
    @GetMapping("/{budgetId}/summary")
    public ResponseEntity<?> getBudgetSummary(
            @PathVariable Long budgetId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        BudgetSummaryDTO summary = budgetService.getBudgetSummary(budgetId);
        return ResponseEntity.ok(summary);
    }

    /**
     * PUT /api/budget/{budgetId}
     * Update an existing budget.
     */
    @PutMapping("/{budgetId}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long budgetId,
            @RequestBody Budget updatedBudget,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Budget result = budgetService.updateBudget(budgetId, updatedBudget);
        return ResponseEntity.ok(result);
    }

    /**
     * DELETE /api/budget/{budgetId}
     * Delete a budget.
     */
    @DeleteMapping("/{budgetId}")
    public ResponseEntity<Void> deleteBudget(
            @PathVariable Long budgetId,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        budgetService.deleteBudget(budgetId);
        return ResponseEntity.noContent().build();
    }
}