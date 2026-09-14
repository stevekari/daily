package com.steve.budget;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BudgetApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgetApplication.class, args);
        System.out.println("========================================");
        System.out.println("🚀 Steve Budget App Started!");
        System.out.println("📍 Server running on: http://0.0.0.0:8080");
        System.out.println("🗄️  H2 Console available at: /h2-console");
        System.out.println("========================================");
    }
}