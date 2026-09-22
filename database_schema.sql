-- ============================================================================
-- Complete Steve Budget Application Database Schema
-- Compatible with: PostgreSQL, Supabase, Neon, Render, Railway, AWS RDS
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_budget NUMERIC(12, 2) NOT NULL,
    daily_limit NUMERIC(10, 2) NOT NULL,
    monthly_limit NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'EXPENSE' CHECK (type IN ('EXPENSE', 'INCOME')),
    icon VARCHAR(20),
    color VARCHAR(30),
    budget_limit NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
    category VARCHAR(100),
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date_time ON transactions(date_time);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date_time);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================================================
-- SEED DEFAULT SYSTEM CATEGORIES (Global templates: user_id = NULL)
-- ============================================================================
INSERT INTO categories (user_id, name, type, icon, color, budget_limit, created_at)
VALUES
    (NULL, 'Shopping', 'EXPENSE', '🛍️', '#ec4899', 300.00, CURRENT_TIMESTAMP),
    (NULL, 'Vehicle', 'EXPENSE', '🚗', '#0284c7', 200.00, CURRENT_TIMESTAMP),
    (NULL, 'Transportation', 'EXPENSE', '🚆', '#3b82f6', 100.00, CURRENT_TIMESTAMP),
    (NULL, 'Investment', 'EXPENSE', '📈', '#10b981', 250.00, CURRENT_TIMESTAMP),
    (NULL, 'On Plan Expenses', 'EXPENSE', '📋', '#8b5cf6', 500.00, CURRENT_TIMESTAMP),
    (NULL, 'Unplanned Expenses', 'EXPENSE', '⚠️', '#f43f5e', 150.00, CURRENT_TIMESTAMP),
    (NULL, 'Food & Dining', 'EXPENSE', '🍔', '#f97316', 350.00, CURRENT_TIMESTAMP),
    (NULL, 'Entertainment', 'EXPENSE', '🎬', '#eab308', 120.00, CURRENT_TIMESTAMP),
    (NULL, 'Health & Medical', 'EXPENSE', '💊', '#14b8a6', 100.00, CURRENT_TIMESTAMP),
    (NULL, 'Salary & Income', 'INCOME', '💰', '#22c55e', 0.00, CURRENT_TIMESTAMP),
    (NULL, 'General', 'EXPENSE', '🏷️', '#64748b', 100.00, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

