package com.steve.budget.service;

import com.steve.budget.dto.BudgetSummaryDTO;
import com.steve.budget.model.Budget;
import com.steve.budget.model.User;
import com.steve.budget.repository.BudgetRepository;
import com.steve.budget.repository.UserRepository;
import com.steve.budget.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * BudgetService
 *
 * Handles all budget-related business logic
 */
@Service
public class BudgetService {

	private final BudgetRepository budgetRepository;
	private final UserRepository userRepository;
	private final TransactionRepository transactionRepository;

	@Autowired
	public BudgetService(BudgetRepository budgetRepository, UserRepository userRepository,
			TransactionRepository transactionRepository) {
		this.budgetRepository = budgetRepository;
		this.userRepository = userRepository;
		this.transactionRepository = transactionRepository;
	}

	// ── CREATE ──────────────────────────────────────────────────────────

	/**
	 * Create a new budget for a user.
	 */
	public Budget createBudget(Budget budget) {
		Long userId = extractUserId(budget);
		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException(
				"User not found with ID: " + userId));

		budget.setUser(user);
		applyBudgetDefaults(budget);
		budget.setCreatedAt(LocalDateTime.now());

		return budgetRepository.save(budget);
	}

	/**
	 * Create or update a budget. If user already has a budget, update it. Otherwise create new one.
	 */
	public Budget createOrUpdateBudget(Budget budget) {
		Long userId = extractUserId(budget);
		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException(
				"User not found with ID: " + userId));

		applyBudgetDefaults(budget);

		return budgetRepository.findFirstByUserOrderByCreatedAtDesc(user).map(existingBudget -> {
			existingBudget.setName(budget.getName());
			existingBudget.setTotalBudget(budget.getTotalBudget());
			existingBudget.setDailyLimit(budget.getDailyLimit());
			existingBudget.setMonthlyLimit(budget.getMonthlyLimit());
			existingBudget.setUpdatedAt(LocalDateTime.now());
			return budgetRepository.save(existingBudget);
		}).orElseGet(() -> {
			budget.setUser(user);
			budget.setCreatedAt(LocalDateTime.now());
			return budgetRepository.save(budget);
		});
	}

	// ── READ ────────────────────────────────────────────────────────────

	/**
	 * Get all budgets for a user.
	 */
	public List<Budget> getUserBudgets(Long userId) {
		if (userId == null) {
			return List.of();
		}
		return userRepository.findById(userId)
				.map(budgetRepository::findByUser)
				.orElse(List.of());
	}

	/**
	 * Get the most recent budget for a user.
	 */
	public Budget getUserActiveBudget(Long userId) {
		if (userId == null) {
			return null;
		}
		return userRepository.findById(userId)
				.flatMap(budgetRepository::findFirstByUserOrderByCreatedAtDesc)
				.orElse(null);
	}

	/**
	 * Get budget summary with spending totals, remaining amount, and ownership check.
	 */
	public BudgetSummaryDTO getBudgetSummary(Long budgetId, Long currentUserId) {
		Budget budget = budgetRepository.findById(budgetId)
				.orElseThrow(() -> new RuntimeException("Budget not found with ID: " + budgetId));

		if (currentUserId != null && budget.getUser() != null && !budget.getUser().getId().equals(currentUserId)) {
			throw new SecurityException("Access denied: you do not own this budget");
		}

		Long userId = budget.getUser().getId();
		LocalDateTime dayStart = LocalDate.now().atStartOfDay();
		LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
		LocalDateTime now = LocalDateTime.now();
		LocalDateTime allTimeStart = LocalDateTime.of(2000, 1, 1, 0, 0);

		BigDecimal rawDaily = transactionRepository.sumExpensesForUserBetween(userId, dayStart, now);
		BigDecimal dailySpent = rawDaily != null ? rawDaily : BigDecimal.ZERO;

		BigDecimal rawMonthly = transactionRepository.sumExpensesForUserBetween(userId, monthStart, now);
		BigDecimal monthlySpent = rawMonthly != null ? rawMonthly : BigDecimal.ZERO;

		BigDecimal rawTotal = transactionRepository.sumExpensesForUserBetween(userId, allTimeStart, now);
		BigDecimal totalSpent = rawTotal != null ? rawTotal : BigDecimal.ZERO;

		BigDecimal remaining = budget.getTotalBudget().subtract(totalSpent);
		if (remaining.compareTo(BigDecimal.ZERO) < 0) {
			remaining = BigDecimal.ZERO;
		}

		double percentage = 0;
		if (budget.getTotalBudget().compareTo(BigDecimal.ZERO) > 0) {
			percentage = totalSpent.divide(budget.getTotalBudget(), 4, RoundingMode.HALF_UP)
					.multiply(BigDecimal.valueOf(100)).doubleValue();
			if (percentage > 100)
				percentage = 100;
		}

		BudgetSummaryDTO summary = new BudgetSummaryDTO();
		summary.setTotalBudget(budget.getTotalBudget());
		summary.setTotalSpent(totalSpent);
		summary.setRemaining(remaining);
		summary.setDailyLimit(budget.getDailyLimit());
		summary.setDailySpent(dailySpent);
		summary.setMonthlyLimit(budget.getMonthlyLimit());
		summary.setMonthlySpent(monthlySpent);
		summary.setStatusPercentage(percentage);

		return summary;
	}

	public BudgetSummaryDTO getBudgetSummary(Long budgetId) {
		return getBudgetSummary(budgetId, null);
	}

	// ── UPDATE ──────────────────────────────────────────────────────────

	/**
	 * Update an existing budget with ownership check.
	 */
	public Budget updateBudget(Long budgetId, Budget updatedBudget, Long currentUserId) {
		Budget budget = budgetRepository.findById(budgetId)
				.orElseThrow(() -> new RuntimeException("Budget not found with ID: " + budgetId));

		if (currentUserId != null && budget.getUser() != null && !budget.getUser().getId().equals(currentUserId)) {
			throw new SecurityException("Access denied: you do not own this budget");
		}

		if (updatedBudget.getName() != null && !updatedBudget.getName().isBlank()) {
			budget.setName(updatedBudget.getName());
		}
		if (updatedBudget.getTotalBudget() != null) {
			budget.setTotalBudget(updatedBudget.getTotalBudget());
		}
		if (updatedBudget.getDailyLimit() != null) {
			budget.setDailyLimit(updatedBudget.getDailyLimit());
		} else if (budget.getTotalBudget() != null && budget.getTotalBudget().compareTo(BigDecimal.ZERO) > 0) {
			budget.setDailyLimit(budget.getTotalBudget().divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP));
		}
		if (updatedBudget.getMonthlyLimit() != null) {
			budget.setMonthlyLimit(updatedBudget.getMonthlyLimit());
		} else if (budget.getTotalBudget() != null) {
			budget.setMonthlyLimit(budget.getTotalBudget());
		}

		budget.setUpdatedAt(LocalDateTime.now());
		return budgetRepository.save(budget);
	}

	public Budget updateBudget(Long budgetId, Budget updatedBudget) {
		return updateBudget(budgetId, updatedBudget, null);
	}

	// ── DELETE ──────────────────────────────────────────────────────────

	/**
	 * Delete a budget with ownership check.
	 */
	public void deleteBudget(Long budgetId, Long currentUserId) {
		Budget budget = budgetRepository.findById(budgetId)
				.orElseThrow(() -> new RuntimeException("Budget not found with ID: " + budgetId));

		if (currentUserId != null && budget.getUser() != null && !budget.getUser().getId().equals(currentUserId)) {
			throw new SecurityException("Access denied: you do not own this budget");
		}

		budgetRepository.deleteById(budgetId);
	}

	public void deleteBudget(Long budgetId) {
		deleteBudget(budgetId, null);
	}

	// ── HELPERS ─────────────────────────────────────────────────────────

	private Long extractUserId(Budget budget) {
		if (budget.getUser() != null && budget.getUser().getId() != null) {
			return budget.getUser().getId();
		}
		if (budget.getUserId() != null) {
			return budget.getUserId();
		}
		throw new RuntimeException("Budget must have a valid user ID.");
	}

	private void applyBudgetDefaults(Budget budget) {
		if (budget.getName() == null || budget.getName().isBlank()) {
			budget.setName("Monthly Budget");
		}
		if (budget.getTotalBudget() == null) {
			budget.setTotalBudget(BigDecimal.ZERO);
		}
		if (budget.getDailyLimit() == null || budget.getDailyLimit().compareTo(BigDecimal.ZERO) <= 0) {
			if (budget.getTotalBudget().compareTo(BigDecimal.ZERO) > 0) {
				budget.setDailyLimit(budget.getTotalBudget().divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP));
			} else {
				budget.setDailyLimit(BigDecimal.valueOf(50));
			}
		}
		if (budget.getMonthlyLimit() == null || budget.getMonthlyLimit().compareTo(BigDecimal.ZERO) <= 0) {
			budget.setMonthlyLimit(budget.getTotalBudget());
		}
	}
}
