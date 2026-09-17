# 💻 Steve Budget Pro - Frontend Client

This is the React 19 + Vite Progressive Web Application (PWA) client for **Steve Budget Pro**.

For full documentation, architecture diagrams, backend API references, and deployment guides, please see the [Root README](../README.md).

---

## 🛠️ Quick Commands

```bash
# Install dependencies
npm install

# Start local development server with HMR (Hot Module Replacement)
npm run dev

# Build production bundle with PWA service worker
npm run build

# Preview production build locally
npm run preview

# Run ESLint check
npm run lint


```

---

## 📁 Key Directories

- `src/components/` — UI components (Dashboard, AnalyticsCharts, SpendingCalendar, BudgetCoach, ReceiptScannerModal, SavingsGoals, SettingsView, etc.)
- `src/styles/` — Stylesheets with theme variables and responsive layout designs
- `src/utils/` — Client-side helpers (exportUtils, notificationEngine, receiptParser, dateFormatting)
- `src/firebase.js` — Firebase Auth, Google Popup, ReCAPTCHA & Phone SMS OTP integration
- `src/LanguageContext.jsx` — Multi-language localization (EN, ES, FR, PT)
- `src/ThemeContext.jsx` — Dark and Light theme engine
