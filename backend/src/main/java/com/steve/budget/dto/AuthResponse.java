package com.steve.budget.dto;

public class AuthResponse {

    private boolean success;
    private String message;
    private String token;
    private String tokenType = "Bearer";
    private Long userId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;

    public AuthResponse() {}

    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public AuthResponse(boolean success, String message, String token, Long userId, String username,
                        String email, String firstName, String lastName) {
        this.success    = success;
        this.message    = message;
        this.token      = token;
        this.tokenType  = "Bearer";
        this.userId     = userId;
        this.username   = username;
        this.email      = email;
        this.firstName  = firstName;
        this.lastName   = lastName;
    }

    public boolean isSuccess()               { return success; }
    public void setSuccess(boolean success)  { this.success = success; }

    public String getMessage()               { return message; }
    public void setMessage(String message)   { this.message = message; }

    public String getToken()                 { return token; }
    public void setToken(String token)       { this.token = token; }

    public String getTokenType()             { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public Long getUserId()                  { return userId; }
    public void setUserId(Long userId)       { this.userId = userId; }

    public String getUsername()              { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail()                 { return email; }
    public void setEmail(String email)       { this.email = email; }

    public String getFirstName()             { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName()              { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}