package com.steve.budget.dto;

import java.math.BigDecimal;

public class BudgetSummaryDTO {

    private BigDecimal totalBudget;
    private BigDecimal totalSpent;
    private BigDecimal remaining;
    private BigDecimal dailyLimit;
    private BigDecimal dailySpent;
    private BigDecimal monthlyLimit;
    private BigDecimal monthlySpent;
    private double statusPercentage;

    public BudgetSummaryDTO() {}

    public BigDecimal getTotalBudget() { return totalBudget; }
    public void setTotalBudget(BigDecimal totalBudget) { this.totalBudget = totalBudget; }

    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }

    public BigDecimal getRemaining() { return remaining; }
    public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }

    public BigDecimal getDailyLimit() { return dailyLimit; }
    public void setDailyLimit(BigDecimal dailyLimit) { this.dailyLimit = dailyLimit; }

    public BigDecimal getDailySpent() { return dailySpent; }
    public void setDailySpent(BigDecimal dailySpent) { this.dailySpent = dailySpent; }

    public BigDecimal getMonthlyLimit() { return monthlyLimit; }
    public void setMonthlyLimit(BigDecimal monthlyLimit) { this.monthlyLimit = monthlyLimit; }

    public BigDecimal getMonthlySpent() { return monthlySpent; }
    public void setMonthlySpent(BigDecimal monthlySpent) { this.monthlySpent = monthlySpent; }

    public double getStatusPercentage() { return statusPercentage; }
    public void setStatusPercentage(double statusPercentage) { this.statusPercentage = statusPercentage; }
}