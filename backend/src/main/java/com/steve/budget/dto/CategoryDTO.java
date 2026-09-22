package com.steve.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CategoryDTO {

    private Long id;
    private Long userId;
    private String name;
    private String type; // EXPENSE, INCOME
    private String icon;
    private String color;
    private BigDecimal budgetLimit;
    private LocalDateTime createdAt;

    public CategoryDTO() {
    }

    public CategoryDTO(Long id, Long userId, String name, String type, String icon, String color, BigDecimal budgetLimit, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.type = type;
        this.icon = icon;
        this.color = color;
        this.budgetLimit = budgetLimit;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public BigDecimal getBudgetLimit() {
        return budgetLimit;
    }

    public void setBudgetLimit(BigDecimal budgetLimit) {
        this.budgetLimit = budgetLimit;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

