package com.steve.budget.dto;

import com.steve.budget.model.Transaction.TransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransactionDTO {

    private Long id;
    private Long userId;
    private String name;
    private BigDecimal amount;
    private LocalDateTime dateTime;
    private TransactionType type;
    private String category;
    private String description;

    public TransactionDTO() {
    }

    public TransactionDTO(Long id,
            String name,
            BigDecimal amount,
            LocalDateTime dateTime,
            TransactionType type,
            String category) {
        this.id = id;
        this.name = name;
        this.amount = amount;
        this.dateTime = dateTime;
        this.type = type;
        this.category = category;
    }

    public TransactionDTO(Long id,
            String name,
            BigDecimal amount,
            LocalDateTime dateTime,
            TransactionType type,
            String category,
            String description) {
        this.id = id;
        this.name = name;
        this.amount = amount;
        this.dateTime = dateTime;
        this.type = type;
        this.category = category;
        this.description = description;
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDateTime getDateTime() {
        return dateTime;
    }

    public void setDateTime(LocalDateTime dateTime) {
        this.dateTime = dateTime;
    }

    public TransactionType getType() {
        return type;
    }

    public void setType(TransactionType type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}