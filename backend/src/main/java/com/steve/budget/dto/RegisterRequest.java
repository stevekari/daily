package com.steve.budget.dto;


public class RegisterRequest {

    private String username;
    private String email;
    private String password;
    private String confirmPassword;
    private String firstName;
    private String lastName;

    public RegisterRequest() {}

    public RegisterRequest(String username, String email, String password,
                           String confirmPassword, String firstName, String lastName) {
        this.username       = username;
        this.email          = email;
        this.password       = password;
        this.confirmPassword = confirmPassword;
        this.firstName      = firstName;
        this.lastName       = lastName;
    }

    public String getUsername()         { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail()            { return email; }
    public void setEmail(String email)  { this.email = email; }

    public String getPassword()         { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getConfirmPassword()  { return confirmPassword; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }

    public String getFirstName()        { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName()         { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
}