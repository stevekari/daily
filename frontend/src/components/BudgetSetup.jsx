import { useState } from "react";
import { useLanguage } from "../LanguageContext";
import { ThemeToggle } from "../ThemeContext";
import { createOrUpdateBudget } from "../dataApi";

/**
 * BudgetSetup Component
 *
 * Welcomes newly logged in users who do not have a budget yet.
 * Allows setting their initial monthly budget and daily spending limit,
 * saves it to the backend database, and transitions to the main dashboard.
 */
export default function BudgetSetup({ userId, username, onBudgetCreated, onLogout }) {
  const { language, setLanguage, t, languageOptions, setShowLanguagePicker } = useLanguage();

  const [name, setName] = useState(() => {
    return localStorage.getItem(`budgetUser_name_${userId}`) || username || "Monthly Budget";
  });

  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const pending = localStorage.getItem(`pendingBudget_${username}`);
    const local = localStorage.getItem(`budgetUser_budget_${userId}`);
    return pending || local || "";
  });

  const [dailyLimit, setDailyLimit] = useState(() => {
    return localStorage.getItem(`budgetUser_daily_${userId}`) || "";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // When monthly budget changes, suggest daily limit if not manually set
  const handleMonthlyChange = (val) => {
    setMonthlyBudget(val);
    if (val && parseFloat(val) > 0 && !dailyLimit) {
      const suggested = Math.round(parseFloat(val) / 30);
      setDailyLimit(String(suggested));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const parsedBudget = parseFloat(monthlyBudget);
    if (!parsedBudget || parsedBudget <= 0) {
      setError(t("pleaseFillNameAmount") || "Please enter a valid monthly budget amount");
      return;
    }

    const parsedDaily = parseFloat(dailyLimit) > 0 ? parseFloat(dailyLimit) : Math.round(parsedBudget / 30);

    setLoading(true);

    try {
      const payload = {
        userId: parseInt(userId),
        user: { id: parseInt(userId) },
        name: name.trim() || "Monthly Budget",
        totalBudget: parsedBudget,
        dailyLimit: parsedDaily,
        monthlyLimit: parsedBudget,
      };

      await createOrUpdateBudget(payload);

      // Save local preferences
      localStorage.setItem(`budgetUser_budget_${userId}`, String(parsedBudget));
      localStorage.setItem(`budgetUser_daily_${userId}`, String(parsedDaily));
      localStorage.setItem(`budgetUser_name_${userId}`, name.trim() || username);
      localStorage.removeItem(`pendingBudget_${username}`);

      if (onBudgetCreated) {
        onBudgetCreated();
      }
    } catch (err) {
      console.error("Failed to create budget:", err);
      if (err.message && err.message.toLowerCase().includes("user not found")) {
        alert("Your session has expired or user was reset. Please log in or register again.");
        if (onLogout) onLogout();
        return;
      }
      setError(err.message || "Failed to save budget. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="form-container" style={{ maxWidth: 480 }}>
        {/* Header Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {localStorage.getItem(`budgetUser_avatar_${username}`) ? (
              <img
                src={localStorage.getItem(`budgetUser_avatar_${username}`)}
                alt={username}
                style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "2px solid #f97316" }}
              />
            ) : (
              <span style={{ fontSize: 26 }}>👤</span>
            )}
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: 1.5, color: "#f97316" }}>
              {username ? username.toUpperCase() : "STEVE BUDGET"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThemeToggle />
            <button
              type="button"
              onClick={onLogout}
              className="secondary-btn"
              style={{ padding: "6px 12px", fontSize: 11 }}
            >
              🚪 {t("logout")}
            </button>
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 className="main-title" style={{ fontSize: 24, marginBottom: 6 }}>
            {t("setBudget")}
          </h1>
          <p className="sub-title">
            {t("welcomeBack")}, <strong style={{ color: "#f97316" }}>{username}</strong>!
          </p>

          {/* Language Selector Bar */}
          <div className="auth-language-section">
            <div className="auth-language-pills">
              {languageOptions.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  className={`auth-lang-btn ${language === opt.code ? "auth-lang-btn--active" : ""}`}
                  onClick={() => setLanguage(opt.code)}
                  title={opt.label}
                >
                  <span className="auth-lang-flag">
                    {opt.code === "en" ? "🇬🇧" : opt.code === "es" ? "🇪🇸" : opt.code === "fr" ? "🇫🇷" : "🇵🇹"}
                  </span>
                  <span className="auth-lang-code">{opt.code.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="auth-lang-modal-trigger"
              onClick={() => setShowLanguagePicker(true)}
              title={t("chooseLanguage")}
            >
              🌐 {t("changeLanguage")} <span>›</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="msg msg-error" style={{ marginBottom: 18 }}>
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            {t("yourName")} / {t("appTitle")}
          </label>
          <input
            className="auth-input"
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <label className="auth-label" style={{ marginTop: 14 }}>
            {t("monthlyBudget")} *
          </label>
          <input
            className="auth-input auth-budget-input"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 1500"
            value={monthlyBudget}
            onChange={(e) => handleMonthlyChange(e.target.value)}
            required
            disabled={loading}
          />

          <label className="auth-label" style={{ marginTop: 14 }}>
            {t("dailyLimit")}
          </label>
          <input
            className="auth-input"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 50"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            className="primary-btn"
            style={{ marginTop: 24 }}
            disabled={loading}
          >
            {loading ? t("loading") : `🚀 ${t("continue")}`}
          </button>
        </form>
      </div>
    </div>
  );
}

