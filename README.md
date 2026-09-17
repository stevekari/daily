# 💰 Steve Budget Pro

> **Intelligent Personal Finance & Budget Management Platform**  
> _Open the app → understand your financial situation in 3 seconds._

[![React 19](https://img.shields.io/badge/React-19.2.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.3-6db33f?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Java 17](https://img.shields.io/badge/Java-17-ed8b00?logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5a0fc8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_&_Phone-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Running Locally (Development Mode)](#1-running-locally-development-mode)
  - [2. Running with Docker Compose](#2-running-with-docker-compose)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Deployment](#-deployment)
  - [Deploy to Render (1-Click)](#deploy-to-render-1-click)
  - [Docker Multi-Stage Build](#docker-multi-stage-build)
- [REST API Reference](#-rest-api-reference)
- [Security & Authentication](#-security--authentication)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

**Steve Budget Pro** is a modern, high-performance personal finance platform built with **React 19**, **Vite**, and **Spring Boot 3**. Designed around clarity, speed, and actionable insights, it empowers users to control daily expenses, safeguard savings, analyze longitudinal spending patterns, and maintain check-and-balance financial discipline.

---

## ✨ Key Features

### 1. 📊 Executive Financial Dashboard & Burn Rate

- **3-Second Overview**: Immediate snapshot of Available Balance, Total Income, Total Expenses, and Percentage of Budget Used.
- **Dynamic Safe Daily Allowance**: Automatically calculates safe daily spending pace based on remaining days in the billing cycle.
- **Daily Spending Limit Bar**: Color-coded progress indicator alerting users before overspending.
- **Billing Cycle Customization**: Configure custom cycle start days (e.g., 1st, 5th, 15th, 25th of the month).

### 2. 📈 Time-Series Financial Analysis & Visual Suite

- **Interactive SVG Spending Curves**: Smooth Bezier area and line charts tracking exact transaction date & time (`Sep 16 at 14:35:12`).
- **Interactive Floating Crosshair & Tooltip**: Instant inspection of merchant, amount, category, and cumulative month spend.
- **24-Hour Time-of-Day Distribution**: 4-quadrant breakdown (_Morning 06:00-12:00_, _Afternoon 12:00-18:00_, _Evening 18:00-23:00_, _Late Night 23:00-06:00_) and peak spending hour identification.
- **Day-of-Week Heatmap**: Monday–Sunday comparison highlighting _Weekday vs. Weekend_ expense ratios.
- **Glowing Category Donut Chart**: High-contrast interactive SVG donut with category isolation filters.
- **Month-by-Month Comparison**: Historical baselines, trend analytics, and health grading (_A+ Excellent_ to _Needs Attention_).

### 3. 🤖 AI Budget Coach & Financial Advisor

- Real-time spending health diagnostics and automated overspending detection.
- Actionable anti-overspending advice tailored to current spending velocity and categories.
- End-of-month projected spending and savings forecasts.

### 4. 🧾 AI Receipt Scanner & Smart Extraction

- Drag-and-drop or mobile camera receipt capture.
- Automated OCR and pattern-matching extraction of **Merchant**, **Date**, **Total Amount**, and **Line Items**.
- Auto-categorization (_Food & Dining_, _Groceries_, _Vehicle_, _Shopping_, _Health_, etc.) with one-click ledger insertion.

### 5. 🎯 Savings Goals & Deposit Trackers

- Visual circular progress rings and milestone tracking for multiple savings targets (e.g., _Emergency Fund_, _Vacation_, _New Laptop_).
- Incremental deposit tracking with target dates and completion celebrations.

### 6. 🔥 Gamification, Streaks & Achievements

- **Logging Streak Counter**: Tracks consecutive days of logging financial activity.
- **Milestone Badges**: Unlockable achievements for consistent savings, budgeting discipline, and milestone deposits.
- **Star Performance Ratings**: End-of-month reviews based on financial health.

### 7. 🔒 Check & Balance Protection (Lock Past Months)

- Prevents accidental modifications or deletions in past closed accounting periods.
- Preserves historical audit integrity and balances across financial quarters.

### 8. 📱 Multi-Channel Notifications & SMS Overspending Alerts

- **In-App Notification Center**: Instant badges, warnings, and achievement banners.
- **Browser Push Notifications**: Desktop & mobile web push notifications.
- **Firebase Phone OTP & SMS Alerts (Optional)**:
  - Accessible post-registration in **Settings** (zero friction during sign-up).
  - **Country Code Selector**: Dropdown supporting international dial codes with flags (`🇪🇸 +34`, `🇺🇸 +1`, `🇬🇧 +44`, `🇫🇷 +33`, `🇩🇪 +49`, `🇵🇹 +351`, `🇬🇭 +233`, `🇳🇬 +234`, `🇮🇳 +91`, etc.).
  - **Local Number Input**: Enter local digits with live formatted E.164 preview.
  - **Invisible reCAPTCHA & SMS OTP**: 6-digit code confirmation.
  - **Automated SMS Dispatch**: Dispatches instant text alerts whenever daily spending exceeds the daily limit.

### 9. 📥 Data Management, Portability & Statements

- **Full JSON Backup**: One-click export and import of all user transactions, budgets, and goals.
- **CSV Ledger Export**: Standard spreadsheet format for Excel, Google Sheets, or Numbers.
- **Printable PDF Statements**: Formal, print-ready financial statement generator.

### 10. 🌐 Multilingual & Premium Theming

- **4 Languages Supported**: 🇬🇧 English (`en`), 🇪🇸 Spanish (`es`), 🇫🇷 French (`fr`), 🇵🇹 Portuguese (`pt`).
- **Dark / Light Modes**: Full theme system with neon glowing glassmorphism accents.
- **PWA (Progressive Web App)**: Installable on iOS (Safari Add to Home Screen), Android (Chrome PWA), Windows, and macOS with offline caching.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Steve Budget Pro Client                         │
│   (React 19 • Vite • PWA Service Worker • Firebase Auth Client)        │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                     REST / JSON   │   Bearer JWT / Firebase Tokens
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Spring Boot 3.4.x Backend Server                     │
│  ┌───────────────────────────────┬──────────────────────────────────┐  │
│  │     Spring Security & JWT     │   Firebase Token Verifier        │  │
│  ├───────────────────────────────┴──────────────────────────────────┤  │
│  │   Controllers: Auth • Budget • Transaction • Global Exception    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │   Services: BudgetService • TransactionService • EmailService    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │   Spring Data JPA / Hibernate Layer                              │  │
│  └───────────────────────────────┬──────────────────────────────────┘  │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Database Persistence Layer                          │
│             PostgreSQL (Production)  /  H2 (Development)               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State & Context**: Custom React Contexts (`LanguageContext`, `ThemeContext`)
- **Visuals & Charts**: Custom SVG Data-Visualizer (No heavyweight chart bloat)
- **Offline & PWA**: `vite-plugin-pwa` + Workbox Service Worker
- **Auth & SMS**: Firebase Authentication SDK (`signInWithPopup`, `RecaptchaVerifier`, `signInWithPhoneNumber`)

### Backend

- **Framework**: [Spring Boot 3.4.3](https://spring.io/projects/spring-boot) (Java 17)
- **Security**: Spring Security + JWT (`io.jsonwebtoken:jjwt:0.12.6`) + Firebase Admin SDK
- **Data & ORM**: Spring Data JPA + Hibernate
- **Database**: PostgreSQL (Production) / H2 In-Memory & File (Development / Embedded)
- **Containerization**: Multi-stage Docker build with Eclipse Temurin 17 JRE

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher
- **Java JDK**: `17` or higher
- **Apache Maven**: `3.9.x` (or use `./mvnw`)
- **Docker & Docker Compose** (Optional, for containerized run)

---

### 1. Running Locally (Development Mode)

#### A. Start the Backend API (Port 8080)

```bash
cd backend
mvn clean spring-boot:run
```

_The Spring Boot server will start on `http://localhost:8080`._

#### B. Start the Frontend Application (Port 5173)

```bash
cd frontend
npm install
npm run dev
```

_Open `http://localhost:5173` in your browser._

---

### 2. Running with Docker Compose

Run the entire full-stack application (embedded React SPA + Spring Boot + storage) in a single command:

```bash
docker compose up --build
```

Access the application at `http://localhost:8080`.

---

## ⚙️ Configuration & Environment Variables

### Backend (`application.properties` / Environment Variables)

| Variable                     | Default Value                 | Description                                |
| :--------------------------- | :---------------------------- | :----------------------------------------- |
| `PORT`                       | `8080`                        | Server listening port                      |
| `SPRING_DATASOURCE_URL`      | `jdbc:h2:mem:budgetdb;...`    | Database connection URL (PostgreSQL or H2) |
| `SPRING_DATASOURCE_USERNAME` | `sa`                          | Database username                          |
| `SPRING_DATASOURCE_PASSWORD` | _(empty)_                     | Database password                          |
| `JWT_SECRET`                 | _(random securely generated)_ | HMAC-SHA256 secret for JWT signing         |
| `JWT_EXPIRATION_MS`          | `604800000` (7 days)          | JWT token expiration in milliseconds       |
| `APP_CORS_ALLOWED_ORIGINS`   | `http://localhost:5173,...`   | Allowed CORS origins                       |
| `FIREBASE_PROJECT_ID`        | `daily-5c591`                 | Firebase Project ID for token verification |

### Frontend (`frontend/.env` or Vite Env)

| Variable                    | Description                                                                               |
| :-------------------------- | :---------------------------------------------------------------------------------------- |
| `VITE_API_URL`              | Base URL for the Spring Boot backend API (empty string if served statically from backend) |
| `VITE_FIREBASE_API_KEY`     | Firebase Web API Key                                                                      |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain                                                            |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase Project ID                                                                       |

---

## 🚢 Deployment

### Deploy to Render (1-Click)

The repository includes a ready-to-deploy [`render.yaml`](file:///Users/stephenkarikari/Desktop/Complete%20Budget%20-app/render.yaml) specification:

1. Push this repository to GitHub / GitLab.
2. In Render Dashboard, click **New > Blueprint** and select your repository.
3. Render will automatically build the multi-stage Docker image and deploy your service with free SSL, health checks at `/health`, and container auto-restart.

### Docker Multi-Stage Build

The root [`Dockerfile`](file:///Users/stephenkarikari/Desktop/Complete%20Budget%20-app/Dockerfile) executes a 3-stage optimization:

1. **Stage 1 (`Node 20 Alpine`)**: Builds and minifies the React 19 SPA.
2. **Stage 2 (`Maven 3.9 Temurin 17`)**: Compiles the Spring Boot backend and embeds the production React assets into `src/main/resources/static`.
3. **Stage 3 (`Temurin 17 JRE Alpine`)**: Creates a lightweight production runtime container (~180MB) with optimized memory flags (`-Xms128m -Xmx320m -XX:+UseSerialGC`).

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)

- `POST /api/auth/register` — Register a new account with email, password, and display name.
- `POST /api/auth/login` — Authenticate with email/password; returns JWT token and user profile.
- `POST /api/auth/firebase-login` — Exchange verified Firebase Google/Email ID token for backend JWT session.
- `POST /api/auth/forgot-password` — Request a 6-digit password reset code to email.
- `POST /api/auth/verify-reset-code` — Verify email confirmation code.
- `POST /api/auth/reset-password` — Set new password using verified token.

### 💰 Budget Management (`/api/budget`)

- `GET /api/budget` — Retrieve current user's monthly budget, daily limit, and currency.
- `POST /api/budget` — Create or update user's budget settings.
- `GET /api/budget/summary` — Get comprehensive calculated summary (Total Spent, Total Income, Safe Daily Pace, Remaining Allowance).

### 💳 Transactions (`/api/transactions`)

- `GET /api/transactions` — Fetch all transactions for the authenticated user (supports category & date filters).
- `POST /api/transactions` — Add a new income or expense transaction with timestamp and category.
- `PUT /api/transactions/{id}` — Update an existing transaction.
- `DELETE /api/transactions/{id}` — Delete a transaction (protected by Check & Balance locks for closed periods).

---

## 🔒 Security & Authentication

1. **JWT Authentication**: Stateless authentication utilizing standard Bearer tokens signed with secure keys.
2. **Brute-Force Protection**: Built-in `LoginAttemptService` with temporary lockouts for consecutive failed login attempts.
3. **Check & Balance Protection**: Closed accounting periods are locked to safeguard historical financial records.
4. **Input Sanitization & Validation**: Strong password requirements and DTO validation with `@Valid`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to open an issue or submit a pull request.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <b>Stephen Karikari</b></sub>
</div>
