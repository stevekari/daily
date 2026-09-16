import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { useTheme, ThemeToggle } from "../ThemeContext";
import { sendPasswordReset } from "../firebase";
import { exportBackupJSON, exportTransactionsToCSV, printFinancialReport } from "../utils/exportUtils";

export const CURRENCY_OPTIONS = [
  { symbol: "€", name: "EUR (€) - Euro" },
  { symbol: "$", name: "USD ($) - US Dollar" },
  { symbol: "£", name: "GBP (£) - British Pound" },
  { symbol: "¥", name: "JPY (¥) - Japanese Yen" },
  { symbol: "CHF", name: "CHF - Swiss Franc" },
  { symbol: "C$", name: "CAD (C$) - Canadian Dollar" },
  { symbol: "A$", name: "AUD (A$) - Australian Dollar" },
  { symbol: "zł", name: "PLN (zł) - Polish Zloty" },
  { symbol: "₹", name: "INR (₹) - Indian Rupee" },
  { symbol: "R$", name: "BRL (R$) - Brazilian Real" },
];

export default function SettingsView({
  userId,
  username,
  displayName,
  userAvatar,
  budgetAmount,
  dailyLimit,
  currencySymbol = "€",
  lockPastMonths = true,
  onSaveProfile,
  onSaveBudget,
  onSaveCurrency,
  onSaveLockPastMonths,
  onOpenImportModal,
  onOpenPwaModal,
  onDeleteAccount,
  onLogout,
  transactions = [],
  goals = [],
}) {
  const { language, setLanguage, t, languageOptions } = useLanguage();
  const { isDark } = useTheme();

  // Local form state
  const [name, setName] = useState(displayName || username || "");
  const [budgetVal, setBudgetVal] = useState(String(budgetAmount || ""));
  const [dailyVal, setDailyVal] = useState(String(dailyLimit || ""));
  const [currency, setCurrency] = useState(currencySymbol || "€");
  const [lockPast, setLockPast] = useState(lockPastMonths);
  const [startOfMonth, setStartOfMonth] = useState(() => {
    return localStorage.getItem(`budgetUser_startDay_${userId}`) || "1";
  });

  const [passwordEmail, setPasswordEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSaveAll = (e) => {
    e?.preventDefault?.();
    setSavedSuccess("");

    if (name.trim()) {
      onSaveProfile(name.trim());
    }

    const numBudget = parseFloat(budgetVal) || 0;
    const numDaily = parseFloat(dailyVal) > 0 ? parseFloat(dailyVal) : Math.round(numBudget / 30);
    onSaveBudget(numBudget, numDaily);
    onSaveCurrency(currency);

    localStorage.setItem(`budgetUser_startDay_${userId}`, startOfMonth);
    localStorage.setItem(`budgetUser_lockPastMonths_${userId}`, String(lockPast));
    if (onSaveLockPastMonths) {
      onSaveLockPastMonths(lockPast);
    }
    setSavedSuccess("Settings updated successfully! ✓");
    setTimeout(() => setSavedSuccess(""), 3500);
  };

  const handlePasswordReset = async () => {
    if (!passwordEmail || !passwordEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    setResetLoading(true);
    setResetSuccess("");
    try {
      await sendPasswordReset(passwordEmail.trim());
      setResetSuccess(`Password reset email sent to ${passwordEmail}! Check your inbox.`);
      setPasswordEmail("");
    } catch (err) {
      alert(err.message || "Failed to send reset email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="settings-view-container" style={{ maxWidth: 760, margin: "0 auto", paddingBottom: 40 }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1, margin: 0, color: "#f97316" }}>
          ⚙️ {t("settings") || "Settings"}
        </h2>
        <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          Manage your account preferences, financial limits, and data portability
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          background: "rgba(16, 185, 129, 0.2)",
          border: "1px solid #10b981",
          color: "#6ee7b7",
          padding: "12px 16px",
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 13,
          marginBottom: 20,
        }}>
          {savedSuccess}
        </div>
      )}

      <form onSubmit={handleSaveAll} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* ── 1. ACCOUNT SECTION ─────────────────────────────────── */}
        <div className="card settings-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            👤 Account & Profile
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #f97316",
              boxShadow: "0 4px 14px rgba(249, 115, 22, 0.4)",
              background: "linear-gradient(135deg, #1e1346, #2d2669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {userAvatar ? (
                <img src={userAvatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
                  {(name || username || "U").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{displayName || username}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Personal Account · UID: {String(userId).slice(0, 8)}...</div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
              Display Name
            </label>
            <input
              className="bs-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          {/* Password Reset Section */}
          <div style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 10,
            padding: 14,
            marginTop: 10,
          }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
              🔐 Security & Password Reset
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                className="bs-form-input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Enter email for reset link"
                value={passwordEmail}
                onChange={(e) => setPasswordEmail(e.target.value)}
              />
              <button
                type="button"
                className="secondary-btn"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                style={{ fontSize: 12, fontWeight: 800, padding: "8px 14px", whiteSpace: "nowrap" }}
              >
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
            {resetSuccess && (
              <p style={{ fontSize: 12, color: "#10b981", fontWeight: 700, margin: "8px 0 0" }}>
                ✓ {resetSuccess}
              </p>
            )}
          </div>
        </div>

        {/* ── 2. FINANCE SECTION ─────────────────────────────────── */}
        <div className="card settings-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            💶 Finance & Budget Limits
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 14 }}>
            {/* Currency */}
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                Currency Symbol
              </label>
              <select
                className="bs-form-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start of Month */}
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                Billing Cycle Start Day
              </label>
              <select
                className="bs-form-input"
                value={startOfMonth}
                onChange={(e) => setStartOfMonth(e.target.value)}
              >
                {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                  <option key={d} value={String(d)}>
                    Day {d} of each month
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            {/* Monthly Budget */}
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                Monthly Budget Limit ({currency})
              </label>
              <input
                className="bs-form-input"
                type="number"
                step="1"
                value={budgetVal}
                onChange={(e) => setBudgetVal(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>

            {/* Daily Limit */}
            <div className="form-group">
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                Daily Spending Limit ({currency})
              </label>
              <input
                className="bs-form-input"
                type="number"
                step="1"
                value={dailyVal}
                onChange={(e) => setDailyVal(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
          </div>

          {/* 🔒 Check & Balance Protection (Lock Past Months) */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 12,
              padding: 16,
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <span style={{ fontSize: 13, fontWeight: 800 }}>
                  {t("lockPastMonthsTitle") || "Check & Balance Protection (Lock Past Months)"}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 6,
                    backgroundColor: lockPast ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    color: lockPast ? "#6ee7b7" : "#fca5a5",
                    border: `1px solid ${lockPast ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                  }}
                >
                  {lockPast ? (t("enabled") || "Enabled (Protected)") : (t("unlocked") || "Unlocked")}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                {t("lockPastMonthsDesc") || "Freeze past closed months to prevent accidental modifications or additions. Maintains financial integrity and balances across accounting periods."}
              </div>
            </div>

            <label style={{ position: "relative", display: "inline-block", width: 48, height: 26, flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={lockPast}
                onChange={(e) => setLockPast(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: lockPast ? "#10b981" : "rgba(255,255,255,0.2)",
                  transition: "0.3s",
                  borderRadius: 26,
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    content: '""',
                    height: 20,
                    width: 20,
                    left: lockPast ? 24 : 3,
                    bottom: 3,
                    backgroundColor: "white",
                    transition: "0.3s",
                    borderRadius: "50%",
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* ── 3. APP & PREFERENCES SECTION ─────────────────────────── */}
        <div className="card settings-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            📱 App & Preferences
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {/* Theme Toggle */}
            <div style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 10,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>Theme Mode</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{isDark ? "Dark Theme" : "Light Theme"}</div>
              </div>
              <ThemeToggle />
            </div>

            {/* Language Selector */}
            <div style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 10,
              padding: 14,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>🌐 Language</div>
              <select
                className="bs-form-input"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languageOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PWA Prompt Shortcut */}
          <div style={{ marginTop: 14 }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onOpenPwaModal}
              style={{ width: "100%", padding: "10px 16px", fontSize: 12, fontWeight: 800 }}
            >
              📲 Install Steve Budget as PWA App / View Guide
            </button>
          </div>
        </div>

        {/* ── 4. DATA PORTABILITY SECTION ─────────────────────────── */}
        <div className="card settings-card" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
            📥 Data Management & Portability
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => exportBackupJSON({ userId, username, budgetAmount, dailyLimit, currencySymbol, transactions, goals })}
              style={{ fontSize: 12, fontWeight: 800, padding: "10px" }}
            >
              📦 Export Full JSON Backup
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => exportTransactionsToCSV(transactions, username, currency)}
              style={{ fontSize: 12, fontWeight: 800, padding: "10px" }}
            >
              📊 Export CSV Ledger
            </button>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => printFinancialReport({ username, budgetAmount, totalSpent: 0, totalIncome: 0, transactions })}
              style={{ fontSize: 12, fontWeight: 800, padding: "10px" }}
            >
              📄 Printable PDF Statement
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: 16 }}>
            <button
              type="button"
              className="btn-submit"
              onClick={onOpenImportModal}
              style={{ flex: 1, minWidth: 160, padding: "10px 16px", fontSize: 12, margin: 0 }}
            >
              📥 Import Backup / CSV
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#fca5a5",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🗑️ Delete Account & Data
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="btn-submit"
          style={{ width: "100%", padding: 14, fontSize: 15, fontWeight: 900, letterSpacing: 1 }}
        >
          💾 Save All Settings
        </button>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="bs-modal-backdrop" onClick={() => setShowDeleteConfirm(false)} role="dialog" aria-modal="true">
          <div className="bs-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "#ef4444", margin: "0 0 10px" }}>
              ⚠️ Delete Account & Clear Data?
            </h3>
            <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, margin: "0 0 18px" }}>
              This will permanently delete your stored budgets, transactions, savings goals, and log you out. This action cannot be undone.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: 0,
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteAccount();
                }}
              >
                Yes, Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

