-- ============================================================================
-- Complete Steve Budget Application Database Schema
-- Compatible with: PostgreSQL, H2, Supabase, Neon, Render, Railway, AWS RDS
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS budgets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    total_budget NUMERIC(12, 2) NOT NULL,
    daily_limit NUMERIC(10, 2) NOT NULL,
    monthly_limit NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'EXPENSE',
    icon VARCHAR(20),
    color VARCHAR(30),
    budget_limit NUMERIC(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date_time TIMESTAMP NOT NULL,
    type VARCHAR(20) NOT NULL,
    category VARCHAR(100),
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
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

