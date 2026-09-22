package com.steve.budget.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Category Entity — Linked to a User (or null for default/system categories)
 */
@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "budgets", "transactions", "password"})
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CategoryType type = CategoryType.EXPENSE;

    @Column(length = 20)
    private String icon;

    @Column(length = 30)
    private String color;

    @Column(precision = 10, scale = 2)
    private BigDecimal budgetLimit;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum CategoryType {
        EXPENSE,
        INCOME
    }

    public Category() {
    }

    public Category(User user, String name, CategoryType type, String icon, String color, BigDecimal budgetLimit) {
        this.user = user;
        this.name = name;
        this.type = type != null ? type : CategoryType.EXPENSE;
        this.icon = icon;
        this.color = color;
        this.budgetLimit = budgetLimit;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public CategoryType getType() {
        return type;
    }

    public void setType(CategoryType type) {
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

