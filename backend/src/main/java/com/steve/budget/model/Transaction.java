package com.steve.budget.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Transaction Entity — Linked to a User
 */
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime dateTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType type;

    @Column
    private String category;

    @Column(length = 500)
    private String description;

    public enum TransactionType {
        EXPENSE,
        INCOME
    }

    // ════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTORS
    // ════════════════════════════════════════════════════════════════════════════

    public Transaction() {
    }

    public Transaction(User user, String name, BigDecimal amount, LocalDateTime dateTime, 
                      TransactionType type, String category) {
        this.user        = user;
        this.name        = name;
        this.amount      = amount;
        this.dateTime    = dateTime;
        this.type        = type;
        this.category    = category;
    }

    public Transaction(User user, String name, BigDecimal amount, LocalDateTime dateTime, 
                      TransactionType type, String category, String description) {
        this.user        = user;
        this.name        = name;
        this.amount      = amount;
        this.dateTime    = dateTime;
        this.type        = type;
        this.category    = category;
        this.description = description;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GETTERS & SETTERS
    // ════════════════════════════════════════════════════════════════════════════

    public Long getId()                     { return id; }
    public void setId(Long id)              { this.id = id; }

    public User getUser()                   { return user; }
    public void setUser(User user)          { this.user = user; }

    public String getName()                 { return name; }
    public void setName(String name)        { this.name = name; }

    public BigDecimal getAmount()           { return amount; }
    public void setAmount(BigDecimal amount){ this.amount = amount; }

    public LocalDateTime getDateTime()              { return dateTime; }
    public void setDateTime(LocalDateTime dateTime) { this.dateTime = dateTime; }

    public TransactionType getType()          { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public String getCategory()               { return category; }
    public void setCategory(String category)  { this.category = category; }

    public String getDescription()            { return description; }
    public void setDescription(String description) { this.description = description; }
}