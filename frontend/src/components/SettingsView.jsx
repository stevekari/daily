import { useState, useEffect } from "react";
import { useLanguage } from "../LanguageContext";
import { useTheme, ThemeToggle } from "../ThemeContext";
import {
  sendPasswordReset,
  initRecaptchaVerifier,
  sendPhoneVerificationSms,
  confirmPhoneOtp,
  sendPhoneSmsAlert,
} from "../firebase";
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

export const COUNTRY_DIAL_CODES = [
  { code: "+34", country: "Spain (ES)", flag: "🇪🇸" },
  { code: "+1", country: "USA / Canada (US/CA)", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom (UK)", flag: "🇬🇧" },
  { code: "+49", country: "Germany (DE)", flag: "🇩🇪" },
  { code: "+33", country: "France (FR)", flag: "🇫🇷" },
  { code: "+39", country: "Italy (IT)", flag: "🇮🇹" },
  { code: "+351", country: "Portugal (PT)", flag: "🇵🇹" },
  { code: "+31", country: "Netherlands (NL)", flag: "🇳🇱" },
  { code: "+32", country: "Belgium (BE)", flag: "🇧🇪" },
  { code: "+41", country: "Switzerland (CH)", flag: "🇨🇭" },
  { code: "+43", country: "Austria (AT)", flag: "🇦🇹" },
  { code: "+46", country: "Sweden (SE)", flag: "🇸🇪" },
  { code: "+47", country: "Norway (NO)", flag: "🇳🇴" },
  { code: "+45", country: "Denmark (DK)", flag: "🇩🇰" },
  { code: "+358", country: "Finland (FI)", flag: "🇫🇮" },
  { code: "+48", country: "Poland (PL)", flag: "🇵🇱" },
  { code: "+353", country: "Ireland (IE)", flag: "🇮🇪" },
  { code: "+30", country: "Greece (GR)", flag: "🇬🇷" },
  { code: "+420", country: "Czech Republic (CZ)", flag: "🇨🇿" },
  { code: "+40", country: "Romania (RO)", flag: "🇷🇴" },
  { code: "+36", country: "Hungary (HU)", flag: "🇭🇺" },
  { code: "+352", country: "Luxembourg (LU)", flag: "🇱🇺" },
  { code: "+55", country: "Brazil (BR)", flag: "🇧🇷" },
  { code: "+52", country: "Mexico (MX)", flag: "🇲🇽" },
  { code: "+54", country: "Argentina (AR)", flag: "🇦🇷" },
  { code: "+56", country: "Chile (CL)", flag: "🇨🇱" },
  { code: "+57", country: "Colombia (CO)", flag: "🇨🇴" },
  { code: "+91", country: "India (IN)", flag: "🇮🇳" },
  { code: "+81", country: "Japan (JP)", flag: "🇯🇵" },
  { code: "+82", country: "South Korea (KR)", flag: "🇰🇷" },
  { code: "+61", country: "Australia (AU)", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand (NZ)", flag: "🇳🇿" },
  { code: "+27", country: "South Africa (ZA)", flag: "🇿🇦" },
  { code: "+234", country: "Nigeria (NG)", flag: "🇳🇬" },
  { code: "+233", country: "Ghana (GH)", flag: "🇬🇭" },
  { code: "+254", country: "Kenya (KE)", flag: "🇰🇪" },
  { code: "+971", country: "UAE (AE)", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia (SA)", flag: "🇸🇦" },
];

export default function SettingsView({
  userId,
  username,
  displayName,
  userAvatar,
  budgetAmount,
  dailyLimit,
  currencySymbol,
  lockPastMonths,
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
  const [budgetVal, setBudgetVal] = useState(() => (budgetAmount > 0 ? String(budgetAmount) : ""));
  const [dailyVal, setDailyVal] = useState(() => (dailyLimit > 0 ? String(dailyLimit) : ""));
  const [currency, setCurrency] = useState(currencySymbol || "€");
  const [lockPast, setLockPast] = useState(lockPastMonths);
  const [startOfMonth, setStartOfMonth] = useState(() => {
    return localStorage.getItem(`budgetUser_startDay_${userId}`) || "1";
  });

  useEffect(() => {
    if (budgetAmount !== undefined && budgetAmount !== null) {
      setBudgetVal(budgetAmount > 0 ? String(budgetAmount) : "");
    }
  }, [budgetAmount]);

  useEffect(() => {
    if (dailyLimit !== undefined && dailyLimit !== null) {
      setDailyVal(dailyLimit > 0 ? String(dailyLimit) : "");
    }
  }, [dailyLimit]);

  // Phone SMS overspending notification state (Optional - post registration)
  const storedFullPhone = typeof window !== "undefined" ? localStorage.getItem(`budgetUser_phone_${userId}`) || "" : "";
  
  const parseStoredPhone = (fullPhone) => {
    if (!fullPhone) return { countryCode: "+34", rawPhone: "" };
    const matched = COUNTRY_DIAL_CODES.find((c) => fullPhone.startsWith(c.code));
    if (matched) {
      return { countryCode: matched.code, rawPhone: fullPhone.slice(matched.code.length) };
    }
    return { countryCode: "+34", rawPhone: fullPhone.replace(/^\+/, "") };
  };

  const initialParsed = parseStoredPhone(storedFullPhone);
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    return localStorage.getItem(`budgetUser_country_code_${userId}`) || initialParsed.countryCode;
  });
  const [rawPhone, setRawPhone] = useState(initialParsed.rawPhone);
  const [isPhoneVerified, setIsPhoneVerified] = useState(() => localStorage.getItem(`budgetUser_phone_verified_${userId}`) === "true");
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(() => localStorage.getItem(`budgetUser_phone_sms_enabled_${userId}`) !== "false");
  const [phoneStep, setPhoneStep] = useState("idle"); // 'idle' | 'code_sent' | 'editing'
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState("");
  const [testSmsLoading, setTestSmsLoading] = useState(false);
  const [testSmsSuccessMsg, setTestSmsSuccessMsg] = useState("");

  const cleanDigits = rawPhone.replace(/\D/g, "").replace(/^0+/, "");
  const formattedFullPhone = cleanDigits ? `${selectedCountryCode}${cleanDigits}` : "";

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

  const handleSendCode = async () => {
    setPhoneError("");
    setPhoneSuccessMsg("");
    if (!cleanDigits || cleanDigits.length < 5) {
      setPhoneError(t("invalidPhoneNumber") || "Please enter a valid phone number (at least 5 digits).");
      return;
    }
    setPhoneLoading(true);
    try {
      const verifier = initRecaptchaVerifier("recaptcha-container");
      const result = await sendPhoneVerificationSms(formattedFullPhone, verifier);
      setConfirmationResult(result);
      setPhoneStep("code_sent");
      setPhoneSuccessMsg(`Verification code sent via SMS to ${formattedFullPhone}! Please enter the 6 digits.`);
    } catch (err) {
      console.error("Phone verification SMS error:", err);
      setPhoneError(err.message || "Failed to send verification SMS. Please verify your phone number format.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    setPhoneError("");
    setPhoneSuccessMsg("");
    if (!otpCode || otpCode.trim().length < 6) {
      setPhoneError("Please enter the 6-digit code received via SMS.");
      return;
    }
    setPhoneLoading(true);
    try {
      await confirmPhoneOtp(confirmationResult, otpCode.trim());
      setIsPhoneVerified(true);
      setPhoneStep("idle");
      setOtpCode("");
      localStorage.setItem(`budgetUser_phone_${userId}`, formattedFullPhone);
      localStorage.setItem(`budgetUser_country_code_${userId}`, selectedCountryCode);
      localStorage.setItem(`budgetUser_phone_verified_${userId}`, "true");
      localStorage.setItem(`budgetUser_phone_sms_enabled_${userId}`, "true");
      setSmsAlertsEnabled(true);
      setPhoneSuccessMsg(t("phoneConnectedSuccess") || "Phone number verified and SMS alerts activated! ✓");
      setTimeout(() => setPhoneSuccessMsg(""), 4000);
    } catch (err) {
      console.error("OTP confirmation error:", err);
      setPhoneError(err.message || "Invalid or expired verification code. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleDisconnectPhone = () => {
    if (window.confirm("Are you sure you want to disconnect this phone number? You will no longer receive SMS overspending alerts.")) {
      setIsPhoneVerified(false);
      setRawPhone("");
      setPhoneStep("idle");
      setOtpCode("");
      localStorage.removeItem(`budgetUser_phone_${userId}`);
      localStorage.removeItem(`budgetUser_country_code_${userId}`);
      localStorage.removeItem(`budgetUser_phone_verified_${userId}`);
      localStorage.removeItem(`budgetUser_phone_sms_enabled_${userId}`);
      setPhoneSuccessMsg(t("phoneDisconnectedSuccess") || "Phone number disconnected.");
      setTimeout(() => setPhoneSuccessMsg(""), 3500);
    }
  };

  const handleToggleSmsAlerts = (enabled) => {
    setSmsAlertsEnabled(enabled);
    localStorage.setItem(`budgetUser_phone_sms_enabled_${userId}`, String(enabled));
  };

  const handleSendTestSms = async () => {
    setPhoneError("");
    setTestSmsSuccessMsg("");
    setTestSmsLoading(true);
    try {
      const currentDaily = parseFloat(dailyVal) || dailyLimit || 50;
      const targetPhone = storedFullPhone || formattedFullPhone;
      await sendPhoneSmsAlert({
        phoneNumber: targetPhone,
        title: "Steve Budget Daily Limit Alert 🚨",
        message: `[TEST ALERT] Steve Budget: You've exceeded your daily spending limit of ${currency}${currentDaily}. Check your dashboard for actionable anti-overspending advice.`,
      });
      setTestSmsSuccessMsg(t("testSmsSuccess") || "Test SMS alert sent successfully to your phone! ✓");
      setTimeout(() => setTestSmsSuccessMsg(""), 4500);
    } catch (err) {
      setPhoneError(err.message || "Failed to send test SMS.");
    } finally {
      setTestSmsLoading(false);
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

        {/* ── 3. PHONE & SMS DAILY OVERSPENDING ALERTS (OPTIONAL POST-REGISTRATION) ── */}
        <div className="card settings-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1.5, margin: 0 }}>
                📱 {t("phoneNotificationsTitle") || "Phone & SMS Daily Overspending Alerts"}
              </h3>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
                {t("phoneNotificationsSubtitle") || "Get instant SMS text alerts when your daily spending exceeds your set daily limit."}
              </p>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 6,
                backgroundColor: isPhoneVerified ? "rgba(16, 185, 129, 0.15)" : "rgba(249, 115, 22, 0.15)",
                color: isPhoneVerified ? "#10b981" : "#f97316",
                border: `1px solid ${isPhoneVerified ? "rgba(16, 185, 129, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {isPhoneVerified ? `✓ ${t("phoneVerifiedBadge") || "Verified & Active"}` : "Optional Feature"}
            </span>
          </div>

          {/* Feedback messages */}
          {phoneSuccessMsg && (
            <div style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "#6ee7b7",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 14,
            }}>
              ✓ {phoneSuccessMsg}
            </div>
          )}

          {phoneError && (
            <div style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 14,
            }}>
              ⚠️ {phoneError}
            </div>
          )}

          {testSmsSuccessMsg && (
            <div style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid #3b82f6",
              color: "#93c5fd",
              padding: "10px 14px",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 12,
              marginBottom: 14,
            }}>
              📱 {testSmsSuccessMsg}
            </div>
          )}

          {/* If phone is already verified */}
          {isPhoneVerified && phoneStep !== "editing" ? (
            <div>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>📱</span>
                    <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: 0.5, color: "#fff" }}>
                      {storedFullPhone || formattedFullPhone}
                    </span>
                    <span style={{ fontSize: 11, background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", padding: "2px 8px", borderRadius: 12, fontWeight: 800 }}>
                      ✓ Verified
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4 }}>
                    Linked for daily spending threshold notifications ({currency}{dailyVal || dailyLimit}/day limit)
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setPhoneStep("editing")}
                    style={{ fontSize: 11, fontWeight: 800, padding: "6px 12px" }}
                  >
                    ✏️ {t("changePhone") || "Change Number"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectPhone}
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#fca5a5",
                      borderRadius: 8,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ {t("disconnectPhone") || "Disconnect"}
                  </button>
                </div>
              </div>

              {/* SMS Alert Toggle */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 12,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>🔔</span>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>
                      {t("enableSmsOverspendAlerts") || "Send SMS Alerts when Daily Limit is Exceeded"}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: 6,
                        backgroundColor: smsAlertsEnabled ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.2)",
                        color: smsAlertsEnabled ? "#6ee7b7" : "#94a3b8",
                      }}
                    >
                      {smsAlertsEnabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 4, lineHeight: 1.4 }}>
                    {t("enableSmsAlertsSub") || "Automatically sends an SMS message if your daily expenses go over your daily limit."}
                  </div>
                </div>

                <label style={{ position: "relative", display: "inline-block", width: 48, height: 26, flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={smsAlertsEnabled}
                    onChange={(e) => handleToggleSmsAlerts(e.target.checked)}
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
                      backgroundColor: smsAlertsEnabled ? "#f97316" : "rgba(255,255,255,0.2)",
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
                        left: smsAlertsEnabled ? 24 : 3,
                        bottom: 3,
                        backgroundColor: "white",
                        transition: "0.3s",
                        borderRadius: "50%",
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Test SMS Button */}
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleSendTestSms}
                  disabled={testSmsLoading}
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span>📲</span>
                  <span>{testSmsLoading ? "Sending Test SMS..." : (t("sendTestSms") || "Send Test SMS Alert")}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Enter Phone / Verify OTP flow with Country Code Picker */
            <div>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 6, display: "block" }}>
                  {t("phoneNumberLabel") || "Phone Number & Country Code"}
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Country Dial Code Dropdown */}
                  <div style={{ minWidth: 160, flex: "0 1 180px" }}>
                    <select
                      className="bs-form-input"
                      style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
                      value={selectedCountryCode}
                      onChange={(e) => setSelectedCountryCode(e.target.value)}
                      disabled={phoneLoading || phoneStep === "code_sent"}
                    >
                      {COUNTRY_DIAL_CODES.map((c) => (
                        <option key={`${c.country}-${c.code}`} value={c.code}>
                          {c.flag} {c.country} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Local Number Input (User only types the digits) */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <input
                      className="bs-form-input"
                      style={{ width: "100%", fontSize: 14, fontWeight: 700, letterSpacing: 0.5 }}
                      type="tel"
                      placeholder={t("phoneNumberPlaceholder") || "e.g. 612 345 678"}
                      value={rawPhone}
                      onChange={(e) => setRawPhone(e.target.value)}
                      disabled={phoneLoading || phoneStep === "code_sent"}
                    />
                  </div>

                  {phoneStep !== "code_sent" ? (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleSendCode}
                      disabled={phoneLoading || !cleanDigits}
                      style={{ fontSize: 12, fontWeight: 800, padding: "10px 16px", whiteSpace: "nowrap" }}
                    >
                      {phoneLoading ? (t("sendingCode") || "Sending Code...") : `📲 ${t("sendVerificationCode") || "Send Verification Code"}`}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => { setPhoneStep("idle"); setOtpCode(""); }}
                      style={{ fontSize: 12, fontWeight: 800, padding: "10px 14px" }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>

                {/* Live formatted international dial preview */}
                {cleanDigits && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🌐 {t("fullNumberPreview") || "International Dial Format"}:</span>
                    <span style={{ color: "#38bdf8", fontWeight: 800, fontFamily: "monospace", fontSize: 13 }}>
                      {formattedFullPhone}
                    </span>
                  </div>
                )}
              </div>

              {/* Invisible reCAPTCHA container required for Firebase Phone Auth */}
              <div id="recaptcha-container" style={{ margin: "4px 0" }}></div>

              {/* Step 2: Enter 6-digit OTP code */}
              {phoneStep === "code_sent" && (
                <div
                  style={{
                    background: "rgba(249, 115, 22, 0.08)",
                    border: "1px solid rgba(249, 115, 22, 0.3)",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 12,
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 800, color: "#f97316", marginBottom: 8, display: "block" }}>
                    💬 {t("enterSmsCode") || "Enter 6-Digit SMS Code sent to"} {formattedFullPhone}
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input
                      className="bs-form-input"
                      style={{ flex: 1, minWidth: 160, letterSpacing: 4, fontSize: 16, fontWeight: 800, textAlign: "center" }}
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    />
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={handleConfirmCode}
                      disabled={phoneLoading || otpCode.length < 6}
                      style={{ margin: 0, padding: "10px 18px", fontSize: 12, fontWeight: 900 }}
                    >
                      {phoneLoading ? (t("verifyingCode") || "Verifying...") : `✓ ${t("verifyAndSavePhone") || "Verify & Activate Phone"}`}
                    </button>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={handleSendCode}
                      disabled={phoneLoading}
                      style={{ fontSize: 11, padding: "8px 12px" }}
                    >
                      🔄 Resend SMS
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: "8px 0 0" }}>
                    💡 Standard SMS rates may apply. You can disconnect or pause alerts anytime in Settings.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 4. APP & PREFERENCES SECTION ─────────────────────────── */}
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

