package com.steve.budget.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public User(Long id) {
		super();
		this.id = id;
	}

	@Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String firstName;

    @Column(length = 50)
    private String lastName;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Budget> budgets = new HashSet<>();

    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private Set<Transaction> transactions = new HashSet<>();

    // ════════════════════════════════════════════════════════════════════════════
    // CONSTRUCTORS
    // ════════════════════════════════════════════════════════════════════════════

  
    public User() {
    }

    /**
     * Full constructor for creating new users during registration
     */
    public User(String username, String email, String password, String firstName, String lastName) {
        this.username  = username;
        this.email     = email;
        this.password  = password;
        this.firstName = firstName;
        this.lastName  = lastName;
    }

    // ════════════════════════════════════════════════════════════════════════════
    // GETTERS & SETTERS
    // ════════════════════════════════════════════════════════════════════════════

    public Long getId()                      { return id; }
    public void setId(Long id)               { this.id = id; }

    public String getUsername()              { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail()                 { return email; }
    public void setEmail(String email)       { this.email = email; }

    public String getPassword()              { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFirstName()             { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName()              { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public Set<Budget> getBudgets()          { return budgets; }
    public void setBudgets(Set<Budget> budgets) { this.budgets = budgets; }

    public Set<Transaction> getTransactions() { return transactions; }
    public void setTransactions(Set<Transaction> transactions) { this.transactions = transactions; }

    /**
     * Helper method to get the user's display name.
     */
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        }
        return username;
    }
}